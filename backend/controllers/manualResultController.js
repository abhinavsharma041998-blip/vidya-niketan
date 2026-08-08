const ManualResult = require('../models/ManualResult');
const Student = require('../models/Student');

const computeTotals = (subjects) => {
  const totalObtained = subjects.reduce((sum, s) => sum + Number(s.marksObtained), 0);
  const totalMax = subjects.reduce((sum, s) => sum + Number(s.maxMarks), 0);
  const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 10000) / 100 : 0;
  return { totalObtained, totalMax, percentage };
};

// @desc  Get all manual results (Admin)
// @route GET /api/admin/manual-results
const getManualResults = async (req, res) => {
  try {
    const results = await ManualResult.find().populate('student', 'name studentId').sort({ createdAt: -1 });
    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Create a manual result (Admin) — optionally publish immediately
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
      student: studentId, title, subjects, remarks,
      totalObtained, totalMax, percentage,
      published: !!publish,
      publishedAt: publish ? new Date() : undefined,
    });

    const populated = await ManualResult.findById(result._id).populate('student', 'name studentId');
    res.status(201).json({ success: true, data: populated, message: publish ? 'Result published' : 'Saved as draft' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update a manual result's content (Admin) — does not change publish status
// @route PUT /api/admin/manual-results/:id
const updateManualResult = async (req, res) => {
  try {
    const { title, subjects, remarks } = req.body;
    const result = await ManualResult.findById(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });

    if (title) result.title = title;
    if (remarks !== undefined) result.remarks = remarks;
    if (Array.isArray(subjects) && subjects.length > 0) {
      result.subjects = subjects;
      const { totalObtained, totalMax, percentage } = computeTotals(subjects);
      result.totalObtained = totalObtained;
      result.totalMax = totalMax;
      result.percentage = percentage;
    }
    await result.save();

    const populated = await ManualResult.findById(result._id).populate('student', 'name studentId');
    res.json({ success: true, data: populated, message: 'Result updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Publish or unpublish a manual result (Admin)
// @route PUT /api/admin/manual-results/:id/publish
const setManualResultPublished = async (req, res) => {
  try {
    const { published } = req.body;
    const result = await ManualResult.findById(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });

    result.published = !!published;
    result.publishedAt = published ? new Date() : undefined;
    await result.save();

    res.json({ success: true, data: result, message: published ? 'Published' : 'Unpublished' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Delete a manual result (Admin)
// @route DELETE /api/admin/manual-results/:id
const deleteManualResult = async (req, res) => {
  try {
    const result = await ManualResult.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get the logged-in student's own published manual results
// @route GET /api/student/manual-results
const getMyManualResults = async (req, res) => {
  try {
    const results = await ManualResult.find({ student: req.student._id, published: true }).sort({ publishedAt: -1, createdAt: -1 });
    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getManualResults, createManualResult, updateManualResult, setManualResultPublished, deleteManualResult,
  getMyManualResults,
};
