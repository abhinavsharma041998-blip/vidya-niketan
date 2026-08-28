const mongoose = require('mongoose');

const paymentSubmissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  method: { type: String, enum: ['UPI', 'Bank Transfer'], required: true },
  amount: { type: Number, required: true },
  transactionRef: { type: String, default: '' }, // UTR / transaction ID, optional but helps admin match it
  note: { type: String, default: '' },
  screenshotUrl: { type: String, required: true },
  screenshotPublicId: { type: String, default: '' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  reviewedByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  reviewedAt: { type: Date },
  rejectionReason: { type: String, default: '' },
  // Once approved, this points at the Fees record that was created/updated so the
  // payment shows up properly in the student's normal Fees screen.
  feesRecord: { type: mongoose.Schema.Types.ObjectId, ref: 'Fees' },
}, { timestamps: true });

module.exports = mongoose.model('PaymentSubmission', paymentSubmissionSchema);
