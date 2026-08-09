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

const NAVY = '#1e3a8a';
const BORDER = '#94a3b8';
const TEXT = '#111827';
const MUTED = '#6b7280';

// Draws just the bordered label part of a cell (no placeholder value) — the value gets
// written separately into the adjoining cell right after this call.
function labelOnlyCell(doc, x, y, w, h, label) {
  doc.rect(x, y, w, h).stroke(BORDER);
  doc.font('Helvetica-Bold').fontSize(7).fillColor(MUTED).text(label.toUpperCase(), x + 5, y + 4, { width: w - 10 });
}

// Draws one row of a fully-gridded table (every cell bordered), optionally with a filled header background.
function tableRow(doc, x, y, rowHeight, columns, cells, opts = {}) {
  let cx = x;
  columns.forEach((col, i) => {
    if (opts.headerFill) doc.rect(cx, y, col.width, rowHeight).fillAndStroke(opts.headerFill, BORDER);
    else if (opts.fill) doc.rect(cx, y, col.width, rowHeight).fillAndStroke(opts.fill, BORDER);
    else doc.rect(cx, y, col.width, rowHeight).stroke(BORDER);
    doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(opts.fontSize || 8.5).fillColor(opts.textColor || TEXT)
      .text(String(cells[i] ?? ''), cx + 5, y + rowHeight / 2 - 4, { width: col.width - 10, align: col.align || 'left' });
    cx += col.width;
  });
}

// Ensures there's room for `neededHeight` more content before the bottom margin; starts a new page if not.
function ensureSpace(doc, neededHeight) {
  if (doc.y + neededHeight > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
}

// @desc  Generate a combined result report PDF — subject-wise marks for every exam/test the
//        student has, both online (auto-graded) and offline/manual (admin-entered) — laid out
//        like an official university exam form: bordered info grid, gridded tables, signatures.
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

    // Build one unified list of "tests", each carrying its own subject-wise marks —
    // this is what makes every subject show up individually instead of one lump total.
    const tests = [
      ...examResults.map(r => {
        const bySubject = new Map(); // subjectName -> { obtained, max }
        const marksPerQ = r.exam?.marksPerQuestion || 1;
        r.answers.forEach(a => {
          const subjName = a.question?.subject?.name || 'General';
          if (!bySubject.has(subjName)) bySubject.set(subjName, { obtained: 0, max: 0 });
          const entry = bySubject.get(subjName);
          entry.max += marksPerQ;
          if (a.isCorrect) entry.obtained += marksPerQ;
        });
        return {
          title: r.exam?.title || 'Online Exam',
          type: 'Online',
          date: r.createdAt,
          totalObtained: r.score,
          totalMax: r.totalMarks,
          percentage: r.percentage,
          subjects: Array.from(bySubject.entries()).map(([name, v]) => ({ name, ...v })),
        };
      }),
      ...manualResults.map(r => ({
        title: r.title,
        type: 'Offline',
        date: r.publishedAt || r.createdAt,
        totalObtained: r.totalObtained,
        totalMax: r.totalMax,
        percentage: r.percentage,
        subjects: r.subjects.map(s => ({ name: s.subjectName, obtained: s.marksObtained, max: s.maxMarks })),
      })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    const totalObtained = tests.reduce((s, t) => s + (t.totalObtained || 0), 0);
    const totalMax = tests.reduce((s, t) => s + (t.totalMax || 0), 0);
    const overallPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 10000) / 100 : 0;
    const overallGrade = getGrade(overallPct);
    const overallResult = overallPct >= PASS_MARK ? 'PASS' : 'FAIL';

    // ── Build the PDF ──────────────────────────────────────────────────────────
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${student.studentId}-result-report.pdf"`);
    doc.pipe(res);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const left = doc.page.margins.left;

    // ── Header: logo + institute name, centered banner style ──────────────────
    const logo = await getLogoBuffer();
    const headerTop = doc.y;
    if (logo) {
      try { doc.image(logo, left, headerTop, { width: 46, height: 46, fit: [46, 46] }); } catch { /* skip */ }
    }
    doc.font('Helvetica-Bold').fontSize(17).fillColor(NAVY)
      .text('VIDYA NIKETAN EDUCATION CENTRE', left, headerTop + 2, { width: pageWidth, align: 'center' });
    doc.font('Helvetica').fontSize(8.5).fillColor(MUTED)
      .text('Consolidated Academic Result Report', left, headerTop + 24, { width: pageWidth, align: 'center' });
    doc.moveDown(2.2);
    doc.lineWidth(2).strokeColor(NAVY).moveTo(left, doc.y).lineTo(left + pageWidth, doc.y).stroke();
    doc.moveDown(0.8);

    // ── Student info grid (bordered, form-style) with photo box on the right ──
    const photoW = 85, photoH = 96;
    const gridX = left, gridW = pageWidth - photoW - 10;
    const labelColW = 78, valueColW = (gridW - labelColW * 2) / 2;
    const rowH = 24;
    const gridTop = doc.y;

    const infoRows = [
      ['Student ID', student.studentId, 'Course', student.course?.name || '—'],
      ["Father's Name", student.fatherName || '—', 'Gender', student.gender || '—'],
      ['Admission Date', student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('en-IN') : '—', 'Status', student.status || 'Active'],
      ['Phone', student.phone || '—', 'Report Date', new Date().toLocaleDateString('en-IN')],
    ];

    doc.rect(gridX, gridTop, gridW, rowH).stroke(BORDER);
    doc.font('Helvetica-Bold').fontSize(7).fillColor(MUTED).text('CANDIDATE NAME', gridX + 5, gridTop + 4);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(TEXT).text(student.name, gridX + 5, gridTop + 14);

    let y = gridTop + rowH;
    infoRows.forEach(([l1, v1, l2, v2]) => {
      labelOnlyCell(doc, gridX, y, labelColW, rowH, l1);
      doc.font('Helvetica').fontSize(9).fillColor(TEXT).text(v1 || '—', gridX + labelColW + 5, y + 8, { width: valueColW - 10 });
      doc.rect(gridX + labelColW, y, valueColW, rowH).stroke(BORDER);

      const l2x = gridX + labelColW + valueColW;
      labelOnlyCell(doc, l2x, y, labelColW, rowH, l2);
      doc.font('Helvetica').fontSize(9).fillColor(TEXT).text(v2 || '—', l2x + labelColW + 5, y + 8, { width: valueColW - 10 });
      doc.rect(l2x + labelColW, y, valueColW, rowH).stroke(BORDER);
      y += rowH;
    });

    const photoX = gridX + gridW + 10;
    doc.rect(photoX, gridTop, photoW, photoH).stroke(BORDER);
    const photoBuf = base64ToBuffer(student.photo);
    if (photoBuf) {
      try { doc.image(photoBuf, photoX + 4, gridTop + 4, { width: photoW - 8, height: photoH - 8, fit: [photoW - 8, photoH - 8] }); } catch { /* skip */ }
    } else {
      doc.font('Helvetica').fontSize(7).fillColor(MUTED).text('Photo', photoX, gridTop + photoH / 2 - 4, { width: photoW, align: 'center' });
    }

    doc.y = y + 20;

    // ── Subject-wise results, one block per exam/test ──────────────────────────
    doc.font('Helvetica-Bold').fontSize(11).fillColor(TEXT).text('Subject-wise Examination Results', left, doc.y);
    doc.moveDown(0.5);

    const subCols = [
      { label: 'S.No', width: 30, align: 'center' },
      { label: 'Subject', width: 260, align: 'left' },
      { label: 'Obtained', width: 75, align: 'center' },
      { label: 'Max', width: 75, align: 'center' },
      { label: '%', width: 45, align: 'center' },
    ];

    if (tests.length === 0) {
      doc.font('Helvetica').fontSize(10).fillColor(MUTED).text('No published results yet.', left, doc.y);
    } else {
      tests.forEach((test) => {
        const blockHeight = 26 + 22 + (test.subjects.length || 1) * 20 + 22 + 14; // title + header + rows + total + gap
        ensureSpace(doc, blockHeight);

        // Test title bar
        const titleY = doc.y;
        doc.rect(left, titleY, pageWidth, 22).fillAndStroke('#eef2ff', NAVY);
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(NAVY)
          .text(`${test.title}`, left + 8, titleY + 6, { width: pageWidth - 220 });
        doc.font('Helvetica').fontSize(8).fillColor(MUTED)
          .text(`${test.type} · ${new Date(test.date).toLocaleDateString('en-IN')}`, left + pageWidth - 200, titleY + 7, { width: 195, align: 'right' });
        let ty = titleY + 22;

        // Subject header row
        tableRow(doc, left, ty, 20, subCols, subCols.map(c => c.label), { bold: true, headerFill: NAVY, textColor: '#ffffff', fontSize: 8 });
        ty += 20;

        if (test.subjects.length === 0) {
          tableRow(doc, left, ty, 20, subCols, ['—', 'No subject breakdown available', '—', '—', '—']);
          ty += 20;
        } else {
          test.subjects.forEach((s, i) => {
            if (ty + 20 > doc.page.height - doc.page.margins.bottom - 20) { doc.addPage(); ty = doc.page.margins.top; }
            const pct = s.max > 0 ? Math.round((s.obtained / s.max) * 1000) / 10 : 0;
            tableRow(doc, left, ty, 20, subCols, [i + 1, s.name, s.obtained, s.max, `${pct}%`]);
            ty += 20;
          });
        }

        // Test subtotal row
        tableRow(doc, left, ty, 22, subCols,
          ['', 'Total', test.totalObtained, test.totalMax, `${test.percentage}%`],
          { bold: true, fill: '#f1f5f9' }
        );
        ty += 22;

        doc.y = ty + 14;
      });
    }

    // ── Overall summary box ─────────────────────────────────────────────────
    ensureSpace(doc, 70);
    const sumTop = doc.y;
    const passColor = overallResult === 'PASS' ? '#059669' : '#dc2626';
    const passFill = overallResult === 'PASS' ? '#ecfdf5' : '#fef2f2';
    doc.rect(left, sumTop, pageWidth, 60).fillAndStroke(passFill, passColor);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(TEXT).text(
      `Total Marks: ${totalObtained} / ${totalMax}    |    Exams/Tests Counted: ${tests.length}`,
      left + 14, sumTop + 12, { width: pageWidth - 28 }
    );
    doc.font('Helvetica-Bold').fontSize(14).fillColor(passColor).text(
      `Overall Percentage: ${overallPct}%   |   Grade: ${overallGrade}   |   Result: ${overallResult}`,
      left + 14, sumTop + 32, { width: pageWidth - 28 }
    );
    doc.y = sumTop + 78;

    // ── Signature lines ────────────────────────────────────────────────────
    ensureSpace(doc, 40);
    const sigY = doc.y;
    doc.font('Helvetica').fontSize(9).fillColor(TEXT);
    doc.text('_____________________________', left, sigY);
    doc.text('Class Teacher / Verified By', left, sigY + 12);
    doc.text('_____________________________', left + pageWidth - 220, sigY);
    doc.text('Principal Sign & Stamp', left + pageWidth - 220, sigY + 12);

    doc.font('Helvetica').fontSize(7.5).fillColor(MUTED).text(
      `Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} — This is a system-generated consolidated report from Vidya Niketan Education Centre.`,
      left, doc.page.height - doc.page.margins.bottom - 12, { width: pageWidth, align: 'center' }
    );

    doc.end();
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { generateResultReport };
