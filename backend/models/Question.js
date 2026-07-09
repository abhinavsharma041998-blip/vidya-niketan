const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  questionText: { type: String, required: true, trim: true },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (arr) => arr.length === 4,
      message: 'A question must have exactly 4 options',
    },
  },
  correctOption: { type: Number, required: true, min: 0, max: 3 }, // index 0-3
  marks: { type: Number, default: 1 },
}, { timestamps: true });

questionSchema.index({ subject: 1 });

module.exports = mongoose.model('Question', questionSchema);
