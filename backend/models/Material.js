const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  category: { type: String, enum: ['Syllabus', 'Notes', 'Assignment', 'Other'], default: 'Other', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },

  // The file itself lives on Cloudinary (free, persistent — unlike Render's disk, which
  // resets on every deploy). We just keep a pointer to it here.
  fileUrl: { type: String, required: true },
  filePublicId: { type: String, required: true }, // needed to delete it from Cloudinary later
  fileName: { type: String, required: true },
  fileType: { type: String }, // extension, e.g. "pdf"
  fileSizeKB: { type: Number },

  uploadedByRole: { type: String, enum: ['Admin', 'Teacher'], required: true },
  uploadedByName: { type: String, required: true },
  uploadedByTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }, // set only if a teacher uploaded it
}, { timestamps: true });

module.exports = mongoose.model('Material', materialSchema);
