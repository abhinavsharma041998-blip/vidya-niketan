const mongoose = require('mongoose');

const querySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  email: { type: String },
  course: { type: String },
  message: { type: String, required: true },
  status: { type: String, enum: ['New', 'Contacted', 'Enrolled', 'Closed'], default: 'New' },
  adminNote: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Query', querySchema);
