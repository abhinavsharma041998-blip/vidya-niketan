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
    cachedLogoBuffer = null; // no logo — the PDF still renders fine without it
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
  try {
    return Buffer.from(dataUri.split(',')[1], 'base64');
  } catch {
    return null;
  }
};

// @desc  Generate a combined result report PDF (all online + manual results) for a student
// @route GET /api/results/:studentId/report   (Admin)
// @route GET /api/results/my-report            (Student, studentId comes from their own token)
const generateResultReport = async (req, res) => {
  try {
    const studentId = req.params.studentId || req.student._id;
    const student = await Student.findById(studentId).populate('course', 'name');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const [examResults, manualResults] = await Promise.all([
      ExamResult.find({ student: studentId }).populate('exam', 'title marksPerQuestion').sort({ createdAt: 1 }),
      ManualResult.find({ student: studentId, published: true }).sort({ createdAt: 1 }),
    ]);

    const rows = [
      ...examResults.map(r => ({
        title: r.exam?.title || 'Online Exam',
        type: 'Online',
        date: r.createdAt,
        obtained: r.score,
        total: r.totalMarks,
        percentage: r.percentage,
      })),
      ...manualResults.map(r => ({
        title: r.title,
        type: 'Offline',
        date: r.publishedAt || r.createdAt,
        obtained: r.totalObtained,
        total: r.totalMax,
        percentage: r.percentage,
      })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    const totalObtained = rows.reduce((s, r) => s + (r.obtained || 0), 0);
    const totalMax = rows.reduce((s, r) => s + (r.total || 0), 0);
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

    // Header: logo + institute name
    const logo = await getLogoBuffer();
    let headerY = doc.y;
    if (logo) {
      try { doc.image(logo, left, headerY, { width: 50, height: 50, fit: [50, 50] }); } catch { /* skip if not a valid image */ }
    }
    doc.font('Helvetica-Bold').fontSize(18).fillColor('#1e3a8a')
      .text('Vidya Niketan Education Centre', left + (logo ? 62 : 0), headerY + 4, { width: pageWidth - (logo ? 62 : 0) });
    doc.font('Helvetica').fontSize(9).fillColor('#6b7280')
      .text('Consolidated Academic Result Report', left + (logo ? 62 : 0), headerY + 26);

    doc.moveDown(2.5);
    doc.strokeColor('#1e3a8a').lineWidth(1.5).moveTo(left, doc.y).lineTo(left + pageWidth, doc.y).stroke();
    doc.moveDown(1);

    // Student info box
    const boxTop = doc.y;
    const boxHeight = 100;
    doc.roundedRect(left, boxTop, pageWidth, boxHeight, 6).fillAndStroke('#f8fafc', '#e2e8f0');

    const photoBuf = base64ToBuffer(student.photo);
    const textX = left + 16 + (photoBuf ? 80 : 0);
    if (photoBuf) {
      try { doc.image(photoBuf, left + 16, boxTop + 14, { width: 70, height: 70, fit: [70, 70] }); } catch { /* skip */ }
    }

    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(11).text(student.name, textX, boxTop + 14);
    doc.font('Helvetica').fontSize(9).fillColor('#374151');
    const infoLines = [
      `Student ID: ${student.studentId}`,
      `Course: ${student.course?.name || '—'}`,
      `Father's Name: ${student.fatherName || '—'}`,
      `Admission Date: ${student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('en-IN') : '—'}`,
    ];
    infoLines.forEach((line, i) => doc.text(line, textX, boxTop + 34 + i * 15));

    doc.y = boxTop + boxHeight + 20;

    // Results table
    if (rows.length === 0) {
      doc.font('Helvetica').fontSize(11).fillColor('#6b7280').text('No published results yet.', left, doc.y);
    } else {
      const colWidths = { title: pageWidth * 0.32, type: pageWidth * 0.13, date: pageWidth * 0.15, marks: pageWidth * 0.18, pct: pageWidth * 0.11, grade: pageWidth * 0.11 };
      const tableTop = doc.y;
      const rowHeight = 22;

      const drawRow = (y, cells, opts = {}) => {
        doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor(opts.color || '#111827');
        let x = left;
        Object.keys(colWidths).forEach((key) => {
          doc.text(cells[key] ?? '', x + 6, y + 6, { width: colWidths[key] - 8, align: opts.align?.[key] || 'left' });
          x += colWidths[key];
        });
      };

      // Header row
      doc.rect(left, tableTop, pageWidth, rowHeight).fill('#1e3a8a');
      drawRow(tableTop, { title: 'Exam / Test', type: 'Type', date: 'Date', marks: 'Marks', pct: '%', grade: 'Grade' }, { bold: true, color: '#ffffff' });

      let y = tableTop + rowHeight;
      rows.forEach((r, i) => {
        if (y + rowHeight > doc.page.height - doc.page.margins.bottom - 100) {
          doc.addPage();
          y = doc.page.margins.top;
        }
        if (i % 2 === 1) doc.rect(left, y, pageWidth, rowHeight).fill('#f1f5f9');
        drawRow(y, {
          title: r.title.length > 38 ? r.title.slice(0, 36) + '…' : r.title,
          type: r.type,
          date: new Date(r.date).toLocaleDateString('en-IN'),
          marks: `${r.obtained}/${r.total}`,
          pct: `${r.percentage}%`,
          grade: getGrade(r.percentage),
        }, { align: { marks: 'center', pct: 'center', grade: 'center' } });
        y += rowHeight;
      });
      doc.y = y + 20;
    }

    // Summary
    if (doc.y + 90 > doc.page.height - doc.page.margins.bottom) doc.addPage();
    const summaryTop = doc.y;
    doc.roundedRect(left, summaryTop, pageWidth, 80, 6).fillAndStroke(overallResult === 'PASS' ? '#ecfdf5' : '#fef2f2', overallResult === 'PASS' ? '#10b981' : '#ef4444');
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(11).text('Overall Summary', left + 16, summaryTop + 12);
    doc.font('Helvetica').fontSize(10).fillColor('#374151');
    doc.text(`Total Exams/Tests Counted: ${rows.length}`, left + 16, summaryTop + 32);
    doc.text(`Total Marks: ${totalObtained} / ${totalMax}`, left + 16, summaryTop + 48);
    doc.font('Helvetica-Bold').fontSize(13).fillColor(overallResult === 'PASS' ? '#059669' : '#dc2626');
    doc.text(`Overall Percentage: ${overallPct}%   |   Grade: ${overallGrade}   |   Result: ${overallResult}`, left + 16, summaryTop + 64);

    doc.y = summaryTop + 100;
    doc.font('Helvetica').fontSize(8).fillColor('#9ca3af')
      .text(`Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} — Vidya Niketan Education Centre`, left, doc.page.height - doc.page.margins.bottom - 20, { width: pageWidth, align: 'center' });

    doc.end();
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { generateResultReport };
