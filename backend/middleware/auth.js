const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

// ─── Protect Admin Routes ─────────────────────────────────────────────────────
const protectAdmin = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access only' });
    req.admin = await Admin.findById(decoded.id).select('-password');
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ─── Protect Student Routes ───────────────────────────────────────────────────
const protectStudent = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'student') return res.status(403).json({ success: false, message: 'Student access only' });
    req.student = await Student.findById(decoded.id).select('-password').populate('course');
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ─── Protect Teacher Routes ────────────────────────────────────────────────────
const protectTeacher = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'teacher') return res.status(403).json({ success: false, message: 'Teacher access only' });
    req.teacher = await Teacher.findById(decoded.id).select('-password').populate('course');
    if (!req.teacher || req.teacher.status !== 'Active') {
      return res.status(403).json({ success: false, message: 'This teacher account is inactive' });
    }
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ─── Protect Staff Routes (Admin OR Teacher) ──────────────────────────────────
// Used for endpoints both roles share, like uploading study materials.
// Sets req.staff = { role, id, name } regardless of which one it was.
const protectStaff = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === 'admin') {
      const admin = await Admin.findById(decoded.id).select('-password');
      if (!admin) return res.status(401).json({ success: false, message: 'Invalid token' });
      req.staff = { role: 'Admin', id: admin._id, name: admin.name || 'Admin', teacherDoc: null };
      return next();
    }
    if (decoded.role === 'teacher') {
      const teacher = await Teacher.findById(decoded.id).select('-password').populate('course');
      if (!teacher || teacher.status !== 'Active') return res.status(403).json({ success: false, message: 'This teacher account is inactive' });
      req.staff = { role: 'Teacher', id: teacher._id, name: teacher.name, teacherDoc: teacher };
      return next();
    }
    return res.status(403).json({ success: false, message: 'Staff access only' });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ─── Protect Either (Admin or Student) ───────────────────────────────────────
const protectAny = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

module.exports = { protectAdmin, protectStudent, protectTeacher, protectStaff, protectAny };
