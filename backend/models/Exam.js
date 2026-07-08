const mongoose = require('mongoose');

const examSubjectSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  numberOfQuestions: { type: Number, required: true, min: 1 },
}, { _id: false });

const examSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, // optional: restrict exam to a course
  subjects: {
    type: [examSubjectSchema],
    validate: {
      validator: (arr) => arr.length > 0,
      message: 'Exam must have at least one subject',
    },
  },
  durationMinutes: { type: Number, required: true, default: 60 },
  marksPerQuestion: { type: Number, default: 1 },
  status: { type: String, enum: ['Draft', 'Published', 'Closed'], default: 'Draft' },

  // Admin-controlled attempt window. A student can only START the exam between these two timestamps.
  scheduledStart: { type: Date, required: true },
  scheduledEnd: { type: Date, required: true },
}, { timestamps: true });

examSchema.pre('validate', function (next) {
  if (this.scheduledStart && this.scheduledEnd && this.scheduledEnd <= this.scheduledStart) {
    return next(new Error('scheduledEnd must be after scheduledStart'));
  }
  next();
});

// Virtual: total questions across all subjects (auto-calculated, always in sync)
examSchema.virtual('totalQuestions').get(function () {
  return this.subjects.reduce((sum, s) => sum + s.numberOfQuestions, 0);
});

examSchema.virtual('totalMarks').get(function () {
  return this.totalQuestions * this.marksPerQuestion;
});

// Virtual: where are we relative to the admin-set attempt window right now
examSchema.virtual('windowStatus').get(function () {
  const now = new Date();
  if (this.scheduledStart && now < this.scheduledStart) return 'upcoming';
  if (this.scheduledEnd && now > this.scheduledEnd) return 'expired';
  return 'active';
});

examSchema.set('toJSON', { virtuals: true });
examSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Exam', examSchema);
