const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true },
  description: { type: String },
  duration: { type: String, required: true }, // e.g. "6 Months"
  durationMonths: { type: Number },
  fees: { type: Number, required: true },
  syllabusTopics: [{ type: String }],
  eligibility: { type: String },
  category: { type: String, enum: ['Basic', 'Intermediate', 'Advanced', 'Professional'], default: 'Basic' },
  isActive: { type: Boolean, default: true },
  image: { type: String },
  enrolledCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
