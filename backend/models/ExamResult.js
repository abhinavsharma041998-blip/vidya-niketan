const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  selectedOption: { type: Number, default: null }, // null = not answered
  correctOption: { type: Number, required: true },
  isCorrect: { type: Boolean, required: true },
}, { _id: false });

const examResultSchema = new mongoose.Schema({
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  answers: [answerSchema],
  correctCount: { type: Number, required: true },
  wrongCount: { type: Number, required: true },
  unattempted: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  score: { type: Number, required: true },     // marks obtained
  totalMarks: { type: Number, required: true },
  percentage: { type: Number, required: true },
  startedAt: { type: Date, required: true },
  submittedAt: { type: Date, default: Date.now },
  // Anti-cheating record, carried over from the ExamAttempt when it's finalized
  violationCount: { type: Number, default: 0 },
  autoSubmittedForViolations: { type: Boolean, default: false }, // true if exam was force-submitted after too many violations
  violations: [{
    type: { type: String, enum: ['tab_switch', 'window_blur', 'fullscreen_exit', 'copy_paste'] },
    at: { type: Date },
  }],
}, { timestamps: true });

// A student can attempt a given exam only once
examResultSchema.index({ exam: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('ExamResult', examResultSchema);
