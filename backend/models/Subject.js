const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  code: { type: String, trim: true, uppercase: true },
  description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);
