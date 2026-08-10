const PDFDocument = require('pdfkit');
const axios = require('axios');
const Student = require('../models/Student');
const ExamResult = require('../models/ExamResult');
const ManualResult = require('../models/ManualResult');

// The institute logo lives on the deployed frontend (public/assets/logo.png). We fetch it
// once and keep it in memory rather than re-downloading it on every single PDF request.
let cachedLogoBuffer = null;
let triedLogoFetch = false;
const getLogoBuffer = async () => {
  if (triedLogoFetch) return cachedLogoBuffer;
  triedLogoFetch = true;
  try {
    const base = process.env.FRONTEND_URL;
    if (!base) return null;
    const { data } = await axios.get(`${base.replace(/\/$/, '')}/assets/logo.png`, { responseType: 'arraybuffer', timeout: 8000 });
    cachedLogoBuffer = Buffer.from(data);
  } catch {
    cachedLogoBuffer = null;
  }
  return cachedLogoBuffer;
};

const getGrade = (pct) => {
  if (pct >= 90) return 'A+';
  if (pct >= 75) return 'A';
  if (pct >= 60) return 'B';
  if (pct >= 45) return 'C';
  if (pct >= 33) return 'D';
  return 'F';
};
const PASS_MARK = 33;

const base64ToBuffer = (dataUri) => {
  if (!dataUri || !dataUri.startsWith('data:')) return null;
  try { return Buffer.from(dataUri.split(',')[1], 'base64'); }
  catch { return null; }
};

// ── Brand palette (matches the institute's admission form design) ───────────
const NAVY = '#1e3a8a';
const NAVY_DARK = '#1e2a5e';
const PINK = '#db2777';
const TEAL = '#0891b2';
const TEXT = '#1f2937';
const MUTED = '#6b7280';

// A numbered, colored section header bar — e.g. "① STUDENT INFORMATION"
function sectionHeader(doc, y, num, title, color, contentW, margin) {
  const h = 24;
  doc.roundedRect(margin, y, contentW, h, 4).fill(color);
  doc.circle(margin + 16, y + h / 2, 9).fill('#ffffff');
  doc.font('Helvetica-Bold').fontSize(9).fillColor(color).text(String(num), margin + 16 - 3, y + h / 2 - 4);
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff').text(title, margin + 34, y + h / 2 - 5);
  return y + h;
}

// One exam/test's mini results table: a light title bar, a subject grid, and a total row.
function testBlock(doc, y, title, meta, subjects, total, contentW, margin) {
  const rowH = 19, barH = 20;
  doc.roundedRect(margin, y, contentW, barH, 3).fill('#eef2ff');
  doc.font('Helvetica-Bold').fontSize(9).fillColor(NAVY).text(title, margin + 10, y + 6, { width: contentW - 180 });
  doc.font('Helvetica').fontSize(7.5).fillColor(MUTED).text(meta, margin + contentW - 170, y + 6.5, { width: 160, align: 'right' });

  let ty = y + barH + 2;
  const cols = [
    { label: 'Subject', w: contentW * 0.52, align: 'left' },
    { label: 'Obtained', w: contentW * 0.16, align: 'center' },
    { label: 'Max', w: contentW * 0.16, align: 'center' },
    { label: '%', w: contentW * 0.16, align: 'center' },
  ];
  let cx = margin;
  cols.forEach(c => {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(MUTED).text(c.label.toUpperCase(), cx + 2, ty, { width: c.w - 4, align: c.align });
    cx += c.w;
  });
  ty += 13;
  doc.moveTo(margin, ty).lineTo(margin + contentW, ty).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
  ty += 4;

  const rowsToRender = subjects.length > 0 ? subjects : [{ name: 'No subject breakdown available', obtained: null, max: null }];
  rowsToRender.forEach((s, i) => {
    if (i % 2 === 1) doc.rect(margin, ty - 2, contentW, rowH).fill('#f8fafc');
    const pct = s.max ? Math.round((s.obtained / s.max) * 1000) / 10 + '%' : '—';
    const rowVals = [s.name, s.obtained ?? '—', s.max ?? '—', pct];
    let cx2 = margin;
    cols.forEach((c, ci) => {
      doc.font('Helvetica').fontSize(8.5).fillColor(TEXT).text(String(rowVals[ci]), cx2 + 2, ty + 2, { width: c.w - 4, align: c.align });
      cx2 += c.w;
    });
    ty += rowH;
  });

  doc.moveTo(margin, ty).lineTo(margin + contentW, ty).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
  ty += 4;
  const totRow = ['Total', total.obtained, total.max, `${total.pct}%`];
  let cx3 = margin;
  cols.forEach((c, ci) => {
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(NAVY).text(String(totRow[ci]), cx3 + 2, ty, { width: c.w - 4, align: c.align });
    cx3 += c.w;
  });
  return ty + 22;
}

function ensureSpace(doc, y, neededHeight, margin) {
  if (y + neededHeight > doc.page.height - 40) {
    doc.addPage();
    return margin;
  }
  return y;
}

// @desc  Generate a combined, subject-wise result report PDF — styled to match the institute's
//        own admission-form branding (gradient header, numbered colored sections, card layout).
// @route GET /api/results/:studentId/report   (Admin)
// @route GET /api/results/my-report            (Student, studentId comes from their own token)
const generateResultReport = async (req, res) => {
  try {
    const studentId = req.params.studentId || req.student._id;
    const student = await Student.findById(studentId).populate('course', 'name');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const [examResults, manualResults] = await Promise.all([
      ExamResult.find({ student: studentId })
        .populate('exam', 'title marksPerQuestion')
        .populate({ path: 'answers.question', select: 'subject', populate: { path: 'subject', select: 'name' } })
        .sort({ createdAt: 1 }),
      ManualResult.find({ student: studentId, published: true }).sort({ createdAt: 1 }),
    ]);

    const tests = [
      ...examResults.map(r => {
        const bySubject = new Map();
        const marksPerQ = r.exam?.marksPerQuestion || 1;
        r.answers.forEach(a => {
          const subjName = a.question?.subject?.name || 'General';
          if (!bySubject.has(subjName)) bySubject.set(subjName, { obtained: 0, max: 0 });
          const entry = bySubject.get(subjName);
          entry.max += marksPerQ;
          if (a.isCorrect) entry.obtained += marksPerQ;
        });
        return {
          title: r.exam?.title || 'Online Exam', type: 'Online', date: r.createdAt,
          totalObtained: r.score, totalMax: r.totalMarks, percentage: r.percentage,
          subjects: Array.from(bySubject.entries()).map(([name, v]) => ({ name, ...v })),
        };
      }),
      ...manualResults.map(r => ({
        title: r.title, type: 'Offline', date: r.publishedAt || r.createdAt,
        totalObtained: r.totalObtained, totalMax: r.totalMax, percentage: r.percentage,
        subjects: r.subjects.map(s => ({ name: s.subjectName, obtained: s.marksObtained, max: s.maxMarks })),
      })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    const totalObtained = tests.reduce((s, t) => s + (t.totalObtained || 0), 0);
    const totalMax = tests.reduce((s, t) => s + (t.totalMax || 0), 0);
    const overallPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 10000) / 100 : 0;
    const overallGrade = getGrade(overallPct);
    const isPass = overallPct >= PASS_MARK;

    // ── Build the PDF ──────────────────────────────────────────────────────
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${student.studentId}-result-report.pdf"`);
    doc.pipe(res);

    const pageW = doc.page.width;
    const margin = 36;
    const contentW = pageW - margin * 2;

    // Header banner (gradient navy)
    const headerH = 92;
    const grad = doc.linearGradient(0, 0, pageW, headerH);
    grad.stop(0, NAVY_DARK).stop(1, NAVY);
    doc.rect(0, 0, pageW, headerH).fill(grad);

    const logo = await getLogoBuffer();
    if (logo) {
      try {
        doc.save();
        doc.circle(58, 46, 26).clip();
        doc.image(logo, 32, 20, { width: 52, height: 52, fit: [52, 52] });
        doc.restore();
        doc.circle(58, 46, 26).lineWidth(1.5).stroke('#ffffff');
      } catch {
        doc.circle(58, 46, 26).lineWidth(2).stroke('#ffffff');
      }
    } else {
      doc.circle(58, 46, 26).lineWidth(2).stroke('#ffffff');
    }

    doc.font('Helvetica-Bold').fontSize(15).fillColor('#ffffff').text('Vidya Niketan', 96, 24);
    doc.font('Helvetica-Bold').fontSize(15).fillColor('#ffffff').text('Education Centre', 96, 41);
    doc.font('Helvetica').fontSize(8).fillColor('#93c5fd').text('CHINTPURNI, HIMACHAL PRADESH', 96, 60);

    doc.font('Helvetica-Bold').fontSize(26);
    const w1 = doc.widthOfString('RESULT ');
    const w2 = doc.widthOfString('Report');
    const titleRightEdge = pageW - margin;
    doc.fillColor('#ffffff').text('RESULT ', titleRightEdge - w1 - w2, 26);
    doc.fillColor('#5eead4').text('Report', titleRightEdge - w2, 26);
    doc.font('Helvetica').fontSize(8).fillColor('#93c5fd').text('CONSOLIDATED ACADEMIC REPORT', pageW - margin - 220, 60, { width: 220, align: 'right' });

    [0, 1, 2, 3].forEach(i => {
      doc.circle(margin + 4 + i * 10, headerH + 6, 2).fill(i === 0 ? PINK : '#cbd5e1');
    });

    let y = headerH + 20;

    // Student ID / Report Date boxes
    doc.font('Helvetica-Bold').fontSize(7).fillColor(MUTED).text('STUDENT ID', margin, y);
    doc.roundedRect(margin, y + 11, 130, 22, 3).stroke('#cbd5e1');
    doc.font('Helvetica-Bold').fontSize(10).fillColor(TEXT).text(student.studentId, margin + 8, y + 17);

    doc.font('Helvetica-Bold').fontSize(7).fillColor(MUTED).text('REPORT DATE', margin + 150, y);
    doc.roundedRect(margin + 150, y + 11, 130, 22, 3).stroke('#cbd5e1');
    doc.font('Helvetica-Bold').fontSize(10).fillColor(TEXT).text(new Date().toLocaleDateString('en-IN'), margin + 158, y + 17);

    y += 48;

    // Section 1: Student Information card
    y = sectionHeader(doc, y, 1, 'STUDENT INFORMATION', NAVY, contentW, margin);
    const cardTop = y;
    const photoW = 80, photoH = 92;
    const infoW = contentW - photoW - 16;
    const cardH = 108;
    doc.roundedRect(margin, cardTop, contentW, cardH, 4).fillAndStroke('#ffffff', '#e2e8f0');

    const photoBuf = base64ToBuffer(student.photo);
    const photoX = margin + infoW + 16, photoY = cardTop + 10;
    if (photoBuf) {
      try { doc.image(photoBuf, photoX, photoY, { width: photoW, height: photoH, fit: [photoW, photoH] }); } catch { /* skip */ }
      doc.roundedRect(photoX, photoY, photoW, photoH, 4).stroke('#e2e8f0');
    } else {
      doc.roundedRect(photoX, photoY, photoW, photoH, 4).dash(3, { space: 2 }).stroke(PINK);
      doc.undash();
      doc.font('Helvetica').fontSize(7).fillColor(PINK).text('Photo', photoX, photoY + photoH / 2, { width: photoW, align: 'center' });
    }

    const fields = [
      ['FULL NAME', student.name, 'COURSE', student.course?.name || '—'],
      ["FATHER'S NAME", student.fatherName || '—', 'GENDER', student.gender || '—'],
      ['ADMISSION DATE', student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('en-IN') : '—', 'STATUS', student.status || 'Active'],
      ['PHONE', student.phone || '—', 'EMAIL', student.email || '—'],
    ];
    let fy = cardTop + 14;
    const colW = infoW / 2;
    fields.forEach(([l1, v1, l2, v2]) => {
      doc.font('Helvetica-Bold').fontSize(7).fillColor(MUTED).text(l1, margin + 14, fy);
      doc.font('Helvetica').fontSize(9.5).fillColor(TEXT).text(v1, margin + 14, fy + 10, { width: colW - 20 });
      doc.font('Helvetica-Bold').fontSize(7).fillColor(MUTED).text(l2, margin + 14 + colW, fy);
      doc.font('Helvetica').fontSize(9.5).fillColor(TEXT).text(v2, margin + 14 + colW, fy + 10, { width: colW - 20 });
      fy += 24;
    });

    y = cardTop + cardH + 18;

    // Section 2: Subject-wise Results
    y = sectionHeader(doc, y, 2, 'SUBJECT-WISE EXAMINATION RESULTS', TEAL, contentW, margin);
    y += 10;

    if (tests.length === 0) {
      doc.font('Helvetica').fontSize(10).fillColor(MUTED).text('No published results yet.', margin, y);
      y += 24;
    } else {
      tests.forEach(test => {
        const blockHeight = 22 + 17 + (test.subjects.length || 1) * 19 + 22;
        y = ensureSpace(doc, y, blockHeight, margin);
        y = testBlock(doc, y, test.title, `${test.type} · ${new Date(test.date).toLocaleDateString('en-IN')}`, test.subjects,
          { obtained: test.totalObtained, max: test.totalMax, pct: test.percentage }, contentW, margin);
      });
    }

    // Section 3: Overall Summary
    y = ensureSpace(doc, y, 100, margin);
    y = sectionHeader(doc, y, 3, 'OVERALL SUMMARY', PINK, contentW, margin);
    y += 12;

    const sumH = 56;
    doc.roundedRect(margin, y, contentW, sumH, 4).fillAndStroke('#ffffff', '#e2e8f0');
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(MUTED).text('TOTAL MARKS', margin + 16, y + 12);
    doc.font('Helvetica-Bold').fontSize(13).fillColor(TEXT).text(`${totalObtained} / ${totalMax}`, margin + 16, y + 24);

    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(MUTED).text('PERCENTAGE', margin + 150, y + 12);
    doc.font('Helvetica-Bold').fontSize(13).fillColor(TEXT).text(`${overallPct}%`, margin + 150, y + 24);

    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(MUTED).text('GRADE', margin + 270, y + 12);
    doc.font('Helvetica-Bold').fontSize(13).fillColor(TEXT).text(overallGrade, margin + 270, y + 24);

    const pillColor = isPass ? '#059669' : '#dc2626';
    const pillBg = isPass ? '#d1fae5' : '#fee2e2';
    const pillW = 78, pillH = 22;
    const pillX = margin + contentW - pillW - 16, pillY = y + (sumH - pillH) / 2;
    doc.roundedRect(pillX, pillY, pillW, pillH, 11).fill(pillBg);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(pillColor).text(isPass ? 'PASS' : 'FAIL', pillX, pillY + 6.5, { width: pillW, align: 'center' });

    y += sumH + 30;

    // Signature lines
    y = ensureSpace(doc, y, 40, margin);
    doc.font('Helvetica').fontSize(8.5).fillColor(TEXT);
    doc.moveTo(margin, y).lineTo(margin + 150, y).strokeColor('#94a3b8').lineWidth(0.7).stroke();
    doc.text('Class Teacher / Verified By', margin, y + 4);
    doc.moveTo(margin + contentW - 150, y).lineTo(margin + contentW, y).stroke();
    doc.text('Principal Sign & Stamp', margin + contentW - 150, y + 4);

    // Footer bar
    const footerH = 30;
    const footerY = doc.page.height - footerH;
    doc.rect(0, footerY, pageW, footerH).fill(NAVY_DARK);
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff').text('Vidya Niketan Education Centre · Chintpurni', margin, footerY + 11);
    doc.font('Helvetica').fontSize(7).fillColor('#93c5fd').text(`VNEC/RES/${new Date().getFullYear()}`, pageW - margin - 100, footerY + 11, { width: 100, align: 'right' });

    doc.end();
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { generateResultReport };
