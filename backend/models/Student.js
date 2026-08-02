const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  studentId: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  email: { type: String, trim: true },
  address: { type: String },
  dob: { type: Date },
  admissionDate: { type: Date, default: Date.now }, // admin can set this manually to backdate real admission date
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  fatherName: { type: String },
  photo: { type: String },

  // Login credentials
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  // Course info
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  batchStartDate: { type: Date },
  batchEndDate: { type: Date },

  // Status
  status: { type: String, enum: ['Active', 'Inactive', 'Completed'], default: 'Active' },
  notificationsEnabled: { type: Boolean, default: true },
}, { timestamps: true });

// Only auto-generate if the admin left it blank — and do it in a collision-safe way
// (using countDocuments() alone breaks once students are deleted, since the count
// shrinks and a "new" number can collide with an ID that's still in use).
studentSchema.pre('save', async function (next) {
  if (!this.studentId) {
    const Student = mongoose.model('Student');
    let candidate, exists = true;
    let n = await Student.countDocuments();
    while (exists) {
      n += 1;
      candidate = `VN${String(n).padStart(4, '0')}`;
      exists = await Student.exists({ studentId: candidate });
    }
    this.studentId = candidate;
  }
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

studentSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Student', studentSchema);
