const Fees = require('../models/Fees');
const Student = require('../models/Student');
const { sendSMS, sendWhatsApp, templates } = require('../services/notificationService');

// @desc  Add fees record
// @route POST /api/fees
const addFees = async (req, res) => {
  try {
    const { studentId, amount, amountPaid, dueDate, paymentMode, installmentNumber, description } = req.body;

    const student = await Student.findById(studentId).populate('course');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const status = amountPaid >= amount ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Pending';

    const fees = await Fees.create({
      student: studentId,
      course: student.course?._id,
      amount,
      amountPaid: amountPaid || 0,
      dueDate,
      paymentDate: amountPaid > 0 ? new Date() : null,
      paymentMode,
      installmentNumber,
      description,
      status,
    });

    // Notifications
    if (status === 'Paid') {
      const msg = templates.feeReceived(student.name, amountPaid, fees.receiptNumber);
      await sendSMS(student.phone, msg);
      await sendWhatsApp(student.phone, msg);
    } else if (status === 'Pending' || status === 'Partial') {
      const dueDateStr = dueDate ? new Date(dueDate).toLocaleDateString('en-IN') : 'soon';
      const pending = amount - (amountPaid || 0);
      const msg = templates.feeDue(student.name, pending, dueDateStr);
      await sendSMS(student.phone, msg);
      await sendWhatsApp(student.phone, msg);
    }

    res.status(201).json({ success: true, data: fees, message: 'Fee record added' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get fees records
// @route GET /api/fees
const getFees = async (req, res) => {
  try {
    const { studentId, status } = req.query;
    let filter = {};
    if (studentId) filter.student = studentId;
    if (status) filter.status = status;

    const fees = await Fees.find(filter)
      .populate('student', 'name studentId phone')
      .populate('course', 'name')
      .sort({ createdAt: -1 });

    const totalAmount = fees.reduce((sum, f) => sum + f.amount, 0);
    const totalCollected = fees.reduce((sum, f) => sum + f.amountPaid, 0);
    const totalPending = totalAmount - totalCollected;

    res.json({
      success: true,
      count: fees.length,
      data: fees,
      summary: { totalAmount, totalCollected, totalPending },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update fees
// @route PUT /api/fees/:id
const updateFees = async (req, res) => {
  try {
    const { amountPaid } = req.body;
    const fee = await Fees.findById(req.params.id).populate('student');
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });

    fee.amountPaid = amountPaid;
    fee.status = amountPaid >= fee.amount ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Pending';
    if (amountPaid > 0) fee.paymentDate = new Date();
    await fee.save();

    if (fee.status === 'Paid') {
      const msg = templates.feeReceived(fee.student.name, amountPaid, fee.receiptNumber);
      await sendSMS(fee.student.phone, msg);
      await sendWhatsApp(fee.student.phone, msg);
    }

    res.json({ success: true, data: fee, message: 'Fee updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get student's own fees (student panel)
// @route GET /api/fees/me
const getMyFees = async (req, res) => {
  try {
    const fees = await Fees.find({ student: req.student._id })
      .populate('course', 'name')
      .sort({ createdAt: -1 });

    const totalAmount = fees.reduce((s, f) => s + f.amount, 0);
    const totalPaid = fees.reduce((s, f) => s + f.amountPaid, 0);
    const totalPending = totalAmount - totalPaid;

    res.json({
      success: true,
      data: fees,
      summary: { totalAmount, totalPaid, totalPending },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { addFees, getFees, updateFees, getMyFees };
