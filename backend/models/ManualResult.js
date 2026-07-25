const mongoose = require('mongoose');

// One subject's marks within a manually-entered result (e.g. offline/paper exam)
const subjectMarkSchema = new mongoose.Schema({
  subjectName: { type: String, required: true, trim: true },
  marksObtained: { type: Number, required: true, min: 0 },
  maxMarks: { type: Number, required: true, min: 1 },
}, { _id: false });

const manualResultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  title: { type: String, required: true, trim: true }, // e.g. "Mid Term Exam - July 2026"
  subjects: {
    type: [subjectMarkSchema],
    required: true,
    validate: { validator: (v) => Array.isArray(v) && v.length > 0, message: 'At least one subject is required' },
  },
  totalObtained: { type: Number, required: true },
  totalMax: { type: Number, required: true },
  percentage: { type: Number, required: true },
  remarks: { type: String, trim: true },
  // Drafts (published: false) are only visible to the admin. Once published, the
  // student can see it immediately under their results.
  published: { type: Boolean, default: false },
  publishedAt: { type: Date },
}, { timestamps: true });

manualResultSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('ManualResult', manualResultSchema);
