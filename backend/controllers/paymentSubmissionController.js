const PaymentSubmission = require('../models/PaymentSubmission');
const Fees = require('../models/Fees');
const Student = require('../models/Student');
const { uploadBufferToCloudinary, cloudinary } = require('../config/cloudinary');
const { sendSMS, sendWhatsApp, templates } = require('../services/notificationService');

// @desc  Student submits a payment (UPI or Bank Transfer) with a screenshot as proof.
//        It sits as "Pending" until admin reviews it — nothing touches the Fees
//        table yet, so nothing is shown as paid until an admin actually confirms it.
// @route POST /api/payment-submissions
const submitPayment = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please attach a payment screenshot' });
    const { method, amount, transactionRef, note } = req.body;
    if (!method || !amount) return res.status(400).json({ success: false, message: 'Method and amount are required' });

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'vidya-niketan/payment-proofs',
      filename: req.file.originalname,
    });

    const submission = await PaymentSubmission.create({
      student: req.student._id,
      method,
      amount,
      transactionRef,
      note,
      screenshotUrl: result.secure_url,
      screenshotPublicId: result.public_id,
    });

    res.status(201).json({ success: true, data: submission, message: 'Payment submitted. It will reflect once the admin confirms it.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Student's own submission history (so they can see Pending/Approved/Rejected)
// @route GET /api/payment-submissions/me
const getMySubmissions = async (req, res) => {
  try {
    const submissions = await PaymentSubmission.find({ student: req.student._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  All submissions for admin review, newest first
// @route GET /api/payment-submissions
const getAllSubmissions = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const submissions = await PaymentSubmission.find(filter)
      .populate('student', 'name studentId phone course')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: submissions.length, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Admin approves or rejects a submission.
//        On approve: either apply the amount to an existing fee record (applyToFeeId)
//        or create a fresh "Paid" fee record — either way it now shows up properly
//        in the student's normal Fees screen.
// @route PUT /api/payment-submissions/:id/review
const reviewSubmission = async (req, res) => {
  try {
    const { action, applyToFeeId, rejectionReason } = req.body; // action: 'Approve' | 'Reject'
    const submission = await PaymentSubmission.findById(req.params.id).populate('student');
    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });
    if (submission.status !== 'Pending') return res.status(400).json({ success: false, message: `Already ${submission.status.toLowerCase()}` });

    if (action === 'Reject') {
      submission.status = 'Rejected';
      submission.rejectionReason = rejectionReason || '';
      submission.reviewedByAdmin = req.admin._id;
      submission.reviewedAt = new Date();
      await submission.save();
      return res.json({ success: true, data: submission, message: 'Submission rejected' });
    }

    if (action !== 'Approve') return res.status(400).json({ success: false, message: 'Invalid action' });

    const student = submission.student;
    let fee;

    if (applyToFeeId) {
      fee = await Fees.findOne({ _id: applyToFeeId, student: student._id });
      if (!fee) return res.status(404).json({ success: false, message: 'Selected fee record not found for this student' });
      fee.amountPaid = Math.min(fee.amount, (fee.amountPaid || 0) + submission.amount);
      fee.status = fee.amountPaid >= fee.amount ? 'Paid' : fee.amountPaid > 0 ? 'Partial' : 'Pending';
      fee.paymentDate = new Date();
      fee.paymentMode = submission.method === 'UPI' ? 'UPI' : 'Online';
      await fee.save();
    } else {
      const populatedStudent = await Student.findById(student._id).populate('course');
      fee = await Fees.create({
        student: student._id,
        course: populatedStudent.course?._id,
        amount: submission.amount,
        amountPaid: submission.amount,
        paymentDate: new Date(),
        paymentMode: submission.method === 'UPI' ? 'UPI' : 'Online',
        description: `Online payment (${submission.method})${submission.transactionRef ? ` — Ref: ${submission.transactionRef}` : ''}`,
        status: 'Paid',
      });
    }

    submission.status = 'Approved';
    submission.reviewedByAdmin = req.admin._id;
    submission.reviewedAt = new Date();
    submission.feesRecord = fee._id;
    await submission.save();

    try {
      const msg = templates.feeReceived(student.name, submission.amount, fee.receiptNumber);
      await sendSMS(student.phone, msg);
      await sendWhatsApp(student.phone, msg);
    } catch { /* notification failure shouldn't block the approval */ }

    res.json({ success: true, data: submission, message: 'Payment approved and reflected in student fees' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { submitPayment, getMySubmissions, getAllSubmissions, reviewSubmission };
