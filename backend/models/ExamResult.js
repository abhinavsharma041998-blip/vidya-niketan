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
}, { timestamps: true });

// A student can attempt a given exam only once
examResultSchema.index({ exam: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('ExamResult', examResultSchema);
