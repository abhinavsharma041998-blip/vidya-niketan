const mongoose = require('mongoose');

// Singleton document — admin edits this from the panel, students just read it.
// Keeping it in the DB (instead of hardcoded) is the whole point: admin can
// change the QR/UPI ID/bank details any time without a code deploy.
const paymentSettingsSchema = new mongoose.Schema({
  upiId: { type: String, default: '' },
  qrImageUrl: { type: String, default: '' },
  qrImagePublicId: { type: String, default: '' },
  whatsappNumber: { type: String, default: '' },
  bank: {
    accountHolder: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    accountType: { type: String, default: '' },
    upiId: { type: String, default: '' }, // shown again on the Bank Transfer tab, can differ/match the one above
    ifsc: { type: String, default: '' },
    branchName: { type: String, default: '' },
  },
}, { timestamps: true });

// Always resolve to the single settings doc, creating a blank one on first use.
paymentSettingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

module.exports = mongoose.model('PaymentSettings', paymentSettingsSchema);
