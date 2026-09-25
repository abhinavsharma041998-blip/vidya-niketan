const RecruitmentNotice = require('../models/RecruitmentNotice');

// @desc  Get recruitment notices (Public) — ?state=Himachal Pradesh, ?active=true (default), ?includeExpired=true
// @route GET /api/recruitment-notices
const getNotices = async (req, res) => {
  try {
    const { state, includeExpired } = req.query;
    const filter = { active: true };
    if (state && state !== 'All India') filter.state = state;
    if (!includeExpired) {
      // Show notices with no deadline, or whose deadline hasn't passed yet
      filter.$or = [{ lastDate: { $exists: false } }, { lastDate: null }, { lastDate: { $gte: new Date() } }];
    }

    const notices = await RecruitmentNotice.find(filter).sort({ lastDate: 1, createdAt: -1 });
    res.json({ success: true, count: notices.length, data: notices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get all notices including inactive/expired (Admin — for management view)
// @route GET /api/recruitment-notices/admin
const getAllNoticesAdmin = async (req, res) => {
  try {
    const notices = await RecruitmentNotice.find().sort({ createdAt: -1 });
    res.json({ success: true, count: notices.length, data: notices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Create a recruitment notice (Admin)
// @route POST /api/recruitment-notices
const createNotice = async (req, res) => {
  try {
    const notice = await RecruitmentNotice.create({
      ...req.body,
      postedByName: req.admin?.name || 'Admin',
    });
    res.status(201).json({ success: true, data: notice, message: 'Notice added' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update a recruitment notice (Admin)
// @route PUT /api/recruitment-notices/:id
const updateNotice = async (req, res) => {
  try {
    const notice = await RecruitmentNotice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    res.json({ success: true, data: notice, message: 'Notice updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Delete a recruitment notice (Admin)
// @route DELETE /api/recruitment-notices/:id
const deleteNotice = async (req, res) => {
  try {
    const notice = await RecruitmentNotice.findByIdAndDelete(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    res.json({ success: true, message: 'Notice deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getNotices, getAllNoticesAdmin, createNotice, updateNotice, deleteNotice };
