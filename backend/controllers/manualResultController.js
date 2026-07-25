const ManualResult = require('../models/ManualResult');
const Student = require('../models/Student');

const computeTotals = (subjects) => {
  const totalObtained = subjects.reduce((sum, s) => sum + Number(s.marksObtained || 0), 0);
  const totalMax = subjects.reduce((sum, s) => sum + Number(s.maxMarks || 0), 0);
  const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 10000) / 100 : 0;
  return { totalObtained, totalMax, percentage };
};

// @desc  Create a manual result (draft or published directly)
// @route POST /api/admin/manual-results
const createManualResult = async (req, res) => {
  try {
    const { studentId, title, subjects, remarks, publish } = req.body;
    if (!studentId || !title || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ success: false, message: 'Student, title, and at least one subject are required' });
    }
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const { totalObtained, totalMax, percentage } = computeTotals(subjects);

    const result = await ManualResult.create({
      student: studentId,
      title: title.trim(),
      subjects,
      totalObtained,
      totalMax,
      percentage,
      remarks: remarks?.trim() || '',
      published: !!publish,
      publishedAt: publish ? new Date() : null,
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  List manual results (admin) — optional ?studentId= filter
// @route GET /api/admin/manual-results
const getManualResults = async (req, res) => {
  try {
    const filter = {};
    if (req.query.studentId) filter.student = req.query.studentId;
    const results = await ManualResult.find(filter)
      .populate('student', 'name studentId course')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get a single manual result (admin)
// @route GET /api/admin/manual-results/:id
const getManualResult = async (req, res) => {
  try {
    const result = await ManualResult.findById(req.params.id).populate('student', 'name studentId course');
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update a manual result's marks/title/remarks (admin)
// @route PUT /api/admin/manual-results/:id
const updateManualResult = async (req, res) => {
  try {
    const { title, subjects, remarks } = req.body;
    const result = await ManualResult.findById(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });

    if (title) result.title = title.trim();
    if (Array.isArray(subjects) && subjects.length > 0) {
      result.subjects = subjects;
      const { totalObtained, totalMax, percentage } = computeTotals(subjects);
      result.totalObtained = totalObtained;
      result.totalMax = totalMax;
      result.percentage = percentage;
    }
    if (remarks !== undefined) result.remarks = remarks.trim();

    await result.save();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Publish or unpublish a manual result (admin)
// @route PUT /api/admin/manual-results/:id/publish
const togglePublishManualResult = async (req, res) => {
  try {
    const { published } = req.body; // true = publish, false = unpublish (revert to draft)
    const result = await ManualResult.findById(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });

    result.published = !!published;
    result.publishedAt = result.published ? new Date() : null;
    await result.save();

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Delete a manual result (admin)
// @route DELETE /api/admin/manual-results/:id
const deleteManualResult = async (req, res) => {
  try {
    const result = await ManualResult.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    res.json({ success: true, message: 'Result deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Student's own published manual results
// @route GET /api/student/manual-results
const getMyManualResults = async (req, res) => {
  try {
    const results = await ManualResult.find({ student: req.student._id, published: true })
      .sort({ publishedAt: -1, createdAt: -1 });
    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createManualResult, getManualResults, getManualResult, updateManualResult,
  togglePublishManualResult, deleteManualResult, getMyManualResults,
};
