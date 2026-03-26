const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { sendSMS, sendWhatsApp, templates } = require('../services/notificationService');

// @desc  Mark attendance
// @route POST /api/attendance
const markAttendance = async (req, res) => {
  try {
    const { records, date } = req.body;
    // records: [{ studentId, status, note }]
    const attendanceDate = new Date(date || Date.now());
    attendanceDate.setHours(0, 0, 0, 0);

    const results = [];
    for (const record of records) {
      const student = await Student.findById(record.studentId).populate('course');
      if (!student) continue;

      // Upsert: update if exists, create if not
      const attendance = await Attendance.findOneAndUpdate(
        { student: record.studentId, date: attendanceDate },
        {
          student: record.studentId,
          course: student.course?._id,
          date: attendanceDate,
          status: record.status,
          note: record.note,
          markedBy: req.admin?._id,
        },
        { upsert: true, new: true }
      );

      // Send notification for Absent students
      if (record.status === 'Absent' && student.notificationsEnabled && !attendance.notificationSent) {
        const dateStr = attendanceDate.toLocaleDateString('en-IN');
        const msg = templates.attendanceAbsent(student.name, dateStr);
        await sendSMS(student.phone, msg);
        await sendWhatsApp(student.phone, msg);
        await Attendance.findByIdAndUpdate(attendance._id, { notificationSent: true });
      } else if (record.status === 'Present' && student.notificationsEnabled) {
        const dateStr = attendanceDate.toLocaleDateString('en-IN');
        const msg = templates.attendancePresent(student.name, dateStr);
        await sendSMS(student.phone, msg);
        await sendWhatsApp(student.phone, msg);
      }

      results.push(attendance);
    }

    res.json({ success: true, data: results, message: `Attendance marked for ${results.length} students` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get attendance records
// @route GET /api/attendance
const getAttendance = async (req, res) => {
  try {
    const { studentId, date, startDate, endDate, courseId } = req.query;
    let filter = {};

    if (studentId) filter.student = studentId;
    if (courseId) filter.course = courseId;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      filter.date = d;
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const records = await Attendance.find(filter)
      .populate('student', 'name studentId phone')
      .populate('course', 'name')
      .sort({ date: -1 });

    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get student's own attendance summary
// @route GET /api/attendance/me
const getMyAttendance = async (req, res) => {
  try {
    const studentId = req.student._id;
    const records = await Attendance.find({ student: studentId }).sort({ date: -1 });

    const total = records.length;
    const present = records.filter(r => r.status === 'Present').length;
    const absent = records.filter(r => r.status === 'Absent').length;
    const late = records.filter(r => r.status === 'Late').length;
    const percentage = total > 0 ? ((present + late) / total * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        records,
        summary: { total, present, absent, late, percentage: parseFloat(percentage) },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { markAttendance, getAttendance, getMyAttendance };
