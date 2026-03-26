const Student = require('../models/Student');
const Course = require('../models/Course');
const Query = require('../models/Query');
const Fees = require('../models/Fees');
const Attendance = require('../models/Attendance');
const Announcement = require('../models/Announcement');

// @desc  Get admin dashboard stats
// @route GET /api/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalStudents,
      activeStudents,
      totalCourses,
      totalQueries,
      newQueries,
      feesData,
      recentStudents,
      recentQueries,
      announcements,
    ] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ status: 'Active' }),
      Course.countDocuments({ isActive: true }),
      Query.countDocuments(),
      Query.countDocuments({ status: 'New' }),
      Fees.aggregate([
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalCollected: { $sum: '$amountPaid' },
          },
        },
      ]),
      Student.find().populate('course', 'name').select('-password').sort({ createdAt: -1 }).limit(5),
      Query.find().sort({ createdAt: -1 }).limit(5),
      Announcement.find().sort({ createdAt: -1 }).limit(3),
    ]);

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAttendance = await Attendance.aggregate([
      { $match: { date: today } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const attendanceSummary = { Present: 0, Absent: 0, Late: 0 };
    todayAttendance.forEach(a => { attendanceSummary[a._id] = a.count; });

    const fees = feesData[0] || { totalAmount: 0, totalCollected: 0 };

    res.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          activeStudents,
          totalCourses,
          totalQueries,
          newQueries,
          totalRevenue: fees.totalCollected,
          pendingFees: fees.totalAmount - fees.totalCollected,
        },
        todayAttendance: attendanceSummary,
        recentStudents,
        recentQueries,
        announcements,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats };
