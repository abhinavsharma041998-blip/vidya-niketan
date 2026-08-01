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

// Auto-generate student ID
studentSchema.pre('save', async function (next) {
  if (!this.studentId) {
    const count = await mongoose.model('Student').countDocuments();
    this.studentId = `VN${String(count + 1).padStart(4, '0')}`;
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
