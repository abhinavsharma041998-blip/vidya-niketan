// routes/index.js - All API Routes

const express = require('express');
const router = express.Router();

const { adminLogin, studentLogin } = require('../controllers/authController');
const { getStudents, getStudent, createStudent, updateStudent, deleteStudent, getMyProfile } = require('../controllers/studentController');
const { getCourses, getCourse, createCourse, updateCourse, deleteCourse } = require('../controllers/courseController');
const { getQueries, createQuery, updateQuery, deleteQuery } = require('../controllers/queryController');
const { markAttendance, getAttendance, getMyAttendance } = require('../controllers/attendanceController');
const { addFees, getFees, updateFees, getMyFees } = require('../controllers/feesController');
const { sendSMSHandler, sendWhatsAppHandler, sendAnnouncement } = require('../controllers/notificationController');
const { getDashboardStats } = require('../controllers/dashboardController');
const { protectAdmin, protectStudent } = require('../middleware/auth');

// ─── Auth ─────────────────────────────────────────────────────────────────────
router.post('/admin/login', adminLogin);
router.post('/student/login', studentLogin);

// ─── Dashboard ────────────────────────────────────────────────────────────────
router.get('/dashboard', protectAdmin, getDashboardStats);

// ─── Students (Admin) ─────────────────────────────────────────────────────────
router.get('/students', protectAdmin, getStudents);
router.post('/students', protectAdmin, createStudent);
router.get('/students/me', protectStudent, getMyProfile);
router.get('/students/:id', protectAdmin, getStudent);
router.put('/students/:id', protectAdmin, updateStudent);
router.delete('/students/:id', protectAdmin, deleteStudent);

// ─── Courses (Public GET, Admin POST/PUT/DELETE) ───────────────────────────────
router.get('/courses', getCourses);
router.get('/courses/:id', getCourse);
router.post('/courses', protectAdmin, createCourse);
router.put('/courses/:id', protectAdmin, updateCourse);
router.delete('/courses/:id', protectAdmin, deleteCourse);

// ─── Queries (Public POST, Admin GET/DELETE) ───────────────────────────────────
router.post('/queries', createQuery);
router.get('/queries', protectAdmin, getQueries);
router.put('/queries/:id', protectAdmin, updateQuery);
router.delete('/queries/:id', protectAdmin, deleteQuery);

// ─── Attendance ────────────────────────────────────────────────────────────────
router.post('/attendance', protectAdmin, markAttendance);
router.get('/attendance', protectAdmin, getAttendance);
router.get('/attendance/me', protectStudent, getMyAttendance);

// ─── Fees ──────────────────────────────────────────────────────────────────────
router.post('/fees', protectAdmin, addFees);
router.get('/fees', protectAdmin, getFees);
router.put('/fees/:id', protectAdmin, updateFees);
router.get('/fees/me', protectStudent, getMyFees);

// ─── Notifications ─────────────────────────────────────────────────────────────
router.post('/notify/sms', protectAdmin, sendSMSHandler);
router.post('/notify/whatsapp', protectAdmin, sendWhatsAppHandler);
router.post('/notify/announce', protectAdmin, sendAnnouncement);

module.exports = router;
