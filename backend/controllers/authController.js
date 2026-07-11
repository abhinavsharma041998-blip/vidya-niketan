const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

// @desc  Admin Login
// @route POST /api/admin/login
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const admin = await Admin.findOne({ username });
    if (!admin || !(await admin.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.json({
      success: true,
      token: generateToken(admin._id, 'admin'),
      user: { id: admin._id, name: admin.name, username: admin.username, role: 'admin' },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Student Login
// @route POST /api/student/login
const studentLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const student = await Student.findOne({ username }).populate('course');
    if (!student || !(await student.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (student.status === 'Inactive') {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact admin.' });
    }

    res.json({
      success: true,
      token: generateToken(student._id, 'student'),
      user: {
        id: student._id,
        name: student.name,
        studentId: student.studentId,
        username: student.username,
        course: student.course,
        photo: student.photo,
        role: 'student',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { adminLogin, studentLogin };
