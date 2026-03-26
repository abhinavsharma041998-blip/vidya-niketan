const { sendSMS, sendWhatsApp, sendNotification } = require('../services/notificationService');
const Student = require('../models/Student');
const Announcement = require('../models/Announcement');

// @desc  Send SMS to a phone number
// @route POST /api/notify/sms
const sendSMSHandler = async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ success: false, message: 'Phone and message required' });
    const result = await sendSMS(phone, message);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Send WhatsApp to a phone number
// @route POST /api/notify/whatsapp
const sendWhatsAppHandler = async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ success: false, message: 'Phone and message required' });
    const result = await sendWhatsApp(phone, message);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Send announcement to all or selected students
// @route POST /api/notify/announce
const sendAnnouncement = async (req, res) => {
  try {
    const { title, message, targetAudience, courseId, studentId, sendSMSFlag, sendWhatsAppFlag } = req.body;

    let students = [];
    if (targetAudience === 'All') {
      students = await Student.find({ status: 'Active', notificationsEnabled: true });
    } else if (targetAudience === 'Course' && courseId) {
      students = await Student.find({ course: courseId, status: 'Active', notificationsEnabled: true });
    } else if (targetAudience === 'Individual' && studentId) {
      const s = await Student.findById(studentId);
      if (s) students = [s];
    }

    const fullMessage = `📢 ${title}\n\n${message}\n\n- Vidya Niketan Education Centre`;
    const results = [];

    for (const student of students) {
      const personalMsg = fullMessage.replace('[Name]', student.name);
      const result = { student: student.name, phone: student.phone };

      if (sendSMSFlag) result.sms = await sendSMS(student.phone, personalMsg);
      if (sendWhatsAppFlag) result.whatsapp = await sendWhatsApp(student.phone, personalMsg);
      results.push(result);
    }

    // Save announcement record
    await Announcement.create({
      title, message,
      targetAudience,
      course: courseId || null,
      student: studentId || null,
      sendSMS: !!sendSMSFlag,
      sendWhatsApp: !!sendWhatsAppFlag,
      sentBy: req.admin._id,
    });

    res.json({
      success: true,
      message: `Announcement sent to ${results.length} students`,
      results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { sendSMSHandler, sendWhatsAppHandler, sendAnnouncement };
