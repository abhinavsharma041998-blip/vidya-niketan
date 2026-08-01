const Teacher = require('../models/Teacher');

// @desc  Get all teachers (admin)
// @route GET /api/teachers
const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().populate('course', 'name').select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: teachers.length, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Create a teacher account (admin)
// @route POST /api/teachers
const createTeacher = async (req, res) => {
  try {
    const { name, phone, email, subject, username, password, course, photo, status } = req.body;

    const exists = await Teacher.findOne({ username });
    if (exists) return res.status(400).json({ success: false, message: 'Username already taken' });

    const teacher = await Teacher.create({ name, phone, email, subject, username, password, course: course || undefined, photo, status });
    const populated = await Teacher.findById(teacher._id).populate('course', 'name').select('-password');
    res.status(201).json({ success: true, data: populated, message: 'Teacher added' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update a teacher (admin)
// @route PUT /api/teachers/:id
const updateTeacher = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    if (!updateData.course) updateData.course = null; // allow clearing back to "all courses"

    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

    Object.assign(teacher, updateData);
    if (password) teacher.password = password; // triggers re-hash via pre-save hook
    await teacher.save();

    const populated = await Teacher.findById(teacher._id).populate('course', 'name').select('-password');
    res.json({ success: true, data: populated, message: 'Teacher updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Delete a teacher (admin)
// @route DELETE /api/teachers/:id
const deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
    res.json({ success: true, message: 'Teacher removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get the logged-in teacher's own profile
// @route GET /api/teachers/me
const getMyTeacherProfile = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacher._id).populate('course').select('-password');
    res.json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getTeachers, createTeacher, updateTeacher, deleteTeacher, getMyTeacherProfile };
