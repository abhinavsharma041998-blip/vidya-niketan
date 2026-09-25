const mongoose = require('mongoose');

// Admin-curated recruitment notices — manually verified against the official board
// (HPPSC/HPSSC/etc.) so these are guaranteed-accurate, unlike the auto-fetched news feed.
const recruitmentNoticeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },       // e.g. "HPSSC Junior Office Assistant (IT) Recruitment 2026"
  board: { type: String, required: true, trim: true },        // e.g. "HPSSC", "HPPSC", "SSC", "UPSC", "IBPS"
  state: {
    type: String,
    required: true,
    enum: [
      'All India', 'Himachal Pradesh', 'Punjab', 'Haryana', 'Delhi', 'Uttar Pradesh',
      'Uttarakhand', 'Rajasthan', 'Jammu and Kashmir', 'Chandigarh', 'Madhya Pradesh',
      'Bihar', 'Maharashtra', 'Gujarat', 'West Bengal',
    ],
    default: 'Himachal Pradesh',
  },
  postName: { type: String, trim: true },                     // e.g. "Junior Office Assistant, Clerk"
  vacancies: { type: String, trim: true },                     // free text — counts often change / list several posts
  qualification: { type: String, required: true },             // eligibility / minimum qualification, in plain words
  ageLimit: { type: String, trim: true },
  applicationFee: { type: String, trim: true },
  lastDate: { type: Date },
  applyLink: { type: String, trim: true },                     // direct application portal link
  officialNotificationLink: { type: String, trim: true, required: true }, // PDF/notice on the board's own site — the source of truth
  active: { type: Boolean, default: true },                    // admin turns this off once the window closes, instead of deleting
  postedByName: { type: String },
}, { timestamps: true });

recruitmentNoticeSchema.index({ state: 1, active: 1, lastDate: 1 });

module.exports = mongoose.model('RecruitmentNotice', recruitmentNoticeSchema);
