const PaymentSettings = require('../models/PaymentSettings');
const { uploadBufferToCloudinary, cloudinary } = require('../config/cloudinary');

// @desc  Get payment settings (UPI ID, QR image, bank details) — used by both
//        the admin edit screen and the student "Make Payment" screen.
// @route GET /api/payment-settings
const getPaymentSettings = async (req, res) => {
  try {
    const settings = await PaymentSettings.getSingleton();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update payment settings. QR image is optional on each save — if a new
//        file is sent it replaces the old one on Cloudinary, otherwise the
//        existing QR stays as-is.
// @route PUT /api/payment-settings
const updatePaymentSettings = async (req, res) => {
  try {
    const settings = await PaymentSettings.getSingleton();
    const { upiId, whatsappNumber, accountHolder, accountNumber, accountType, bankUpiId, ifsc, branchName } = req.body;

    if (upiId !== undefined) settings.upiId = upiId;
    if (whatsappNumber !== undefined) settings.whatsappNumber = whatsappNumber;
    settings.bank = {
      accountHolder: accountHolder ?? settings.bank.accountHolder,
      accountNumber: accountNumber ?? settings.bank.accountNumber,
      accountType: accountType ?? settings.bank.accountType,
      upiId: bankUpiId ?? settings.bank.upiId,
      ifsc: ifsc ?? settings.bank.ifsc,
      branchName: branchName ?? settings.bank.branchName,
    };

    if (req.file) {
      // Swap out the old QR on Cloudinary so we don't accumulate orphaned images
      if (settings.qrImagePublicId) {
        try { await cloudinary.uploader.destroy(settings.qrImagePublicId); } catch { /* ignore if already gone */ }
      }
      const result = await uploadBufferToCloudinary(req.file.buffer, {
        folder: 'vidya-niketan/payment-qr',
        filename: req.file.originalname,
      });
      settings.qrImageUrl = result.secure_url;
      settings.qrImagePublicId = result.public_id;
    }

    await settings.save();
    res.json({ success: true, data: settings, message: 'Payment settings updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPaymentSettings, updatePaymentSettings };
