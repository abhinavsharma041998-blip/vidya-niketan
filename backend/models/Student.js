const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  studentId: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  email: { type: String, trim: true },
  address: { type: String },
  dob: { type: Date },
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
    const Student = mongoose.model('Student');
    // Using the highest EXISTING studentId (not a document count) means deleting a student
    // never causes a previously-used ID to be reissued and collide with a live student.
    const lastStudent = await Student.findOne({ studentId: { $regex: /^VN\d+$/ } }).sort({ studentId: -1 });
    let nextNum = 1;
    if (lastStudent && lastStudent.studentId) {
      const match = lastStudent.studentId.match(/^VN(\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    let candidateId = `VN${String(nextNum).padStart(4, '0')}`;
    // Extra safety net for the rare case of two students being added at the exact same instant
    while (await Student.exists({ studentId: candidateId })) {
      nextNum += 1;
      candidateId = `VN${String(nextNum).padStart(4, '0')}`;
    }
    this.studentId = candidateId;
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
