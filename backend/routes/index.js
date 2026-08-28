// routes/index.js - All API Routes

const express = require('express');
const router = express.Router();

const { adminLogin, studentLogin, teacherLogin } = require('../controllers/authController');
const { getStudents, getStudent, createStudent, updateStudent, deleteStudent, getMyProfile } = require('../controllers/studentController');
const { getCourses, getCourse, createCourse, updateCourse, deleteCourse } = require('../controllers/courseController');
const { getQueries, createQuery, updateQuery, deleteQuery } = require('../controllers/queryController');
const { markAttendance, getAttendance, getMyAttendance } = require('../controllers/attendanceController');
const { addFees, getFees, updateFees, getMyFees } = require('../controllers/feesController');
const { sendSMSHandler, sendWhatsAppHandler, sendAnnouncement } = require('../controllers/notificationController');
const { getDashboardStats } = require('../controllers/dashboardController');
const {
  getSubjects, createSubject, updateSubject, deleteSubject,
  getQuestions, createQuestion, updateQuestion, deleteQuestion, bulkCreateQuestions,
  getExams, getExam, createExam, updateExam, deleteExam, setExamStatus, getExamResults,
  getAvailableExams, startExam, submitExam, saveProgress, getMyResults, getMyResultDetail,
} = require('../controllers/examController');
const { getTeachers, createTeacher, updateTeacher, deleteTeacher, getMyTeacherProfile } = require('../controllers/teacherController');
const { uploadMaterial, getAllMaterials, getMyMaterials, getStudentMaterials, deleteMaterial } = require('../controllers/materialController');
const upload = require('../middleware/upload');
const { generateResultReport } = require('../controllers/reportController');
const {
  getManualResults, createManualResult, updateManualResult, setManualResultPublished, deleteManualResult,
  getMyManualResults,
} = require('../controllers/manualResultController');
const { protectAdmin, protectStudent, protectTeacher, protectStaff } = require('../middleware/auth');
const { getPaymentSettings, updatePaymentSettings } = require('../controllers/paymentSettingsController');
const { submitPayment, getMySubmissions, getAllSubmissions, reviewSubmission } = require('../controllers/paymentSubmissionController');

// Wraps multer so its errors (file too large, wrong type) come back as clean JSON
// instead of crashing into the generic 500 handler.
const handleUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
    next();
  });
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
router.post('/admin/login', adminLogin);
router.post('/student/login', studentLogin);
router.post('/teacher/login', teacherLogin);

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

// ─── Payment Settings (Admin-configurable UPI/QR/Bank details) ────────────────
router.get('/payment-settings', protectStudent, getPaymentSettings); // student view (Make Payment page)
router.get('/payment-settings/admin', protectAdmin, getPaymentSettings); // admin view (Settings tab)
router.put('/payment-settings', protectAdmin, handleUpload, updatePaymentSettings);

// ─── Payment Submissions (Student submits proof → Admin reviews) ──────────────
router.post('/payment-submissions', protectStudent, handleUpload, submitPayment);
router.get('/payment-submissions/me', protectStudent, getMySubmissions);
router.get('/payment-submissions', protectAdmin, getAllSubmissions);
router.put('/payment-submissions/:id/review', protectAdmin, reviewSubmission);

// ─── Notifications ─────────────────────────────────────────────────────────────
router.post('/notify/sms', protectAdmin, sendSMSHandler);
router.post('/notify/whatsapp', protectAdmin, sendWhatsAppHandler);
router.post('/notify/announce', protectAdmin, sendAnnouncement);

// ─── Exams: Subjects (Admin) ────────────────────────────────────────────────────
router.get('/exam/subjects', protectAdmin, getSubjects);
router.post('/exam/subjects', protectAdmin, createSubject);
router.put('/exam/subjects/:id', protectAdmin, updateSubject);
router.delete('/exam/subjects/:id', protectAdmin, deleteSubject);

// ─── Exams: Question Bank (Admin) ───────────────────────────────────────────────
router.get('/exam/questions', protectAdmin, getQuestions);
router.post('/exam/questions', protectAdmin, createQuestion);
router.post('/exam/questions/bulk', protectAdmin, bulkCreateQuestions);
router.put('/exam/questions/:id', protectAdmin, updateQuestion);
router.delete('/exam/questions/:id', protectAdmin, deleteQuestion);

// ─── Exams: Exam management (Admin) ─────────────────────────────────────────────
router.get('/exam/exams', protectAdmin, getExams);
router.post('/exam/exams', protectAdmin, createExam);
router.get('/exam/exams/:id', protectAdmin, getExam);
router.put('/exam/exams/:id', protectAdmin, updateExam);
router.delete('/exam/exams/:id', protectAdmin, deleteExam);
router.put('/exam/exams/:id/status', protectAdmin, setExamStatus);
router.get('/exam/exams/:id/results', protectAdmin, getExamResults);

// ─── Exams: Student side (Student) ──────────────────────────────────────────────
router.get('/exam/student/available', protectStudent, getAvailableExams);
router.get('/exam/student/my-results', protectStudent, getMyResults);
router.get('/exam/student/my-results/:id', protectStudent, getMyResultDetail);
router.get('/exam/student/:examId/start', protectStudent, startExam);
router.put('/exam/student/:examId/progress', protectStudent, saveProgress);
router.post('/exam/student/:examId/submit', protectStudent, submitExam);

// ─── Teachers (Admin manages accounts; Teacher reads own profile) ──────────────
router.get('/teachers', protectAdmin, getTeachers);
router.post('/teachers', protectAdmin, createTeacher);
router.put('/teachers/:id', protectAdmin, updateTeacher);
router.delete('/teachers/:id', protectAdmin, deleteTeacher);
router.get('/teachers/me', protectTeacher, getMyTeacherProfile);

// ─── Study Materials (Syllabus / Notes / Assignments) ───────────────────────────
// Upload & delete are shared by Admin and Teacher (protectStaff figures out which)
router.post('/materials', protectStaff, handleUpload, uploadMaterial);
router.delete('/materials/:id', protectStaff, deleteMaterial);
router.get('/materials/admin', protectAdmin, getAllMaterials);
router.get('/materials/mine', protectTeacher, getMyMaterials);
router.get('/materials/student', protectStudent, getStudentMaterials);

// ─── Combined Result Report (PDF) ────────────────────────────────────────────
router.get('/results/my-report', protectStudent, generateResultReport);
router.get('/results/:studentId/report', protectAdmin, generateResultReport);

// ─── Manual (Offline/Paper) Results ─────────────────────────────────────────────
router.get('/admin/manual-results', protectAdmin, getManualResults);
router.post('/admin/manual-results', protectAdmin, createManualResult);
router.put('/admin/manual-results/:id', protectAdmin, updateManualResult);
router.put('/admin/manual-results/:id/publish', protectAdmin, setManualResultPublished);
router.delete('/admin/manual-results/:id', protectAdmin, deleteManualResult);
router.get('/student/manual-results', protectStudent, getMyManualResults);

module.exports = router;
