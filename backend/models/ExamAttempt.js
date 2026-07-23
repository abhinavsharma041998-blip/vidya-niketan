const mongoose = require('mongoose');

// Tracks a student's IN-PROGRESS exam attempt — the exact question set they were given
// (so it stays identical on reload) and their answers-so-far, autosaved as they go.
// Once submitted (or auto-finalized after time runs out), this doc is deleted and a
// permanent ExamResult is created instead.
const examAttemptSchema = new mongoose.Schema({
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true }],
  // questionId (string) -> selectedOption (number). Stored as a Map so autosave can
  // update a single answer without re-sending the whole set.
  answers: { type: Map, of: Number, default: {} },
  startedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true }, // startedAt + effective duration
  // Anti-cheating: every time the student switches tab/app/window or leaves fullscreen,
  // the frontend reports it here. Admin can see exactly how many times and when.
  violations: [{
    type: { type: String, enum: ['tab_switch', 'window_blur', 'fullscreen_exit', 'copy_paste'], required: true },
    at: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

examAttemptSchema.index({ exam: 1, student: 1 }, { unique: true });
// Housekeeping: auto-delete stale in-progress attempts 1 hour after they expired
// (a normal submit/auto-finalize removes the doc well before this ever fires).
examAttemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);
