const mongoose = require('mongoose');

const feesSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  amount: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  dueDate: { type: Date },
  paymentDate: { type: Date },
  paymentMode: { type: String, enum: ['Cash', 'Online', 'Cheque', 'UPI'], default: 'Cash' },
  receiptNumber: { type: String, unique: true },
  installmentNumber: { type: Number, default: 1 },
  status: { type: String, enum: ['Paid', 'Pending', 'Partial', 'Overdue'], default: 'Pending' },
  description: { type: String },
  notificationSent: { type: Boolean, default: false },
}, { timestamps: true });

// Auto-generate receipt number
feesSchema.pre('save', async function(next) {
  if (!this.receiptNumber) {
    const count = await mongoose.model('Fees').countDocuments();
    this.receiptNumber = `VN-REC-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Fees', feesSchema);
