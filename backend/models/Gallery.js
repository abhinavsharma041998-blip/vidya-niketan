const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  category: {
    type: String,
    enum: ['Campus', 'Events', 'Classroom', 'Convocation', 'Achievements', 'Other'],
    default: 'Other',
  },

  // The image itself lives on Cloudinary (free, persistent — unlike Render's disk, which
  // resets on every deploy). We just keep a pointer to it here, same pattern as Material.
  imageUrl: { type: String, required: true },
  imagePublicId: { type: String, required: true }, // needed to delete it from Cloudinary later

  // Lets admin control home-page preview + ordering without deleting anything.
  featured: { type: Boolean, default: false },
  order: { type: Number, default: 0 },

  uploadedByName: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema);
