const Student = require('../models/Student');
const { sendSMS, sendWhatsApp, templates } = require('../services/notificationService');

// @desc  Get all students
// @route GET /api/students
const getStudents = async (req, res) => {
  try {
    const { status, course, search } = req.query;
    let filter = {};
    if (status) filter.status = status;
    if (course) filter.course = course;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    const students = await Student.find(filter)
      .populate('course', 'name code fees')
      .select('-password')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get single student
// @route GET /api/students/:id
const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('course')
      .select('-password');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Create student
// @route POST /api/students
const createStudent = async (req, res) => {
  try {
    const { name, phone, email, course, username, password, fatherName, address, gender, dob } = req.body;

    // Check duplicate username
    const exists = await Student.findOne({ username });
    if (exists) return res.status(400).json({ success: false, message: 'Username already taken' });

    const student = await Student.create({
      name, phone, email, course, username, password,
      fatherName, address, gender, dob,
    });

    // Send welcome notifications
    if (student.notificationsEnabled) {
      const courseDoc = await require('../models/Course').findById(course);
      const courseName = courseDoc ? courseDoc.name : 'your course';
      const msg = templates.welcome(name, username, password, courseName);

      await sendSMS(phone, msg);
      await sendWhatsApp(phone, msg);
    }

    const populated = await Student.findById(student._id).populate('course', 'name').select('-password');
    res.status(201).json({ success: true, data: populated, message: 'Student created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update student
// @route PUT /api/students/:id
const updateStudent = async (req, res) => {
  try {
    const { password, ...updateData } = req.body; // Don't allow password change from here
    const student = await Student.findByIdAndUpdate(req.params.id, updateData, {
      new: true, runValidators: true,
    }).populate('course', 'name').select('-password');

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: student, message: 'Student updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Delete student
// @route DELETE /api/students/:id
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get student's own profile (student panel)
// @route GET /api/students/me
const getMyProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.student._id)
      .populate('course')
      .select('-password');
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getStudents, getStudent, createStudent, updateStudent, deleteStudent, getMyProfile };
