const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  email: { type: String, trim: true },
  subject: { type: String }, // what they teach, e.g. "Computer Fundamentals" — just a label
  photo: { type: String },

  // Login credentials
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  // If set, this teacher only sees/uploads for this one course. If left empty, they can
  // upload for any course (useful for a teacher who covers multiple batches).
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },

  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

teacherSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

teacherSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Teacher', teacherSchema);
