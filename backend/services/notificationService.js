/**
 * Notification Service
 * Handles SMS (Twilio / Fast2SMS) and WhatsApp (Twilio) notifications
 * Modular design - easy to swap providers
 */

const twilio = require('twilio');
const axios = require('axios');

// ─── Twilio Client ───────────────────────────────────────────────────────────
const getTwilioClient = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials not configured');
  }
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};

// ─── SMS via Twilio ──────────────────────────────────────────────────────────
const sendSMSTwilio = async (phone, message) => {
  const client = getTwilioClient();
  const result = await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });
  return { success: true, sid: result.sid, provider: 'twilio' };
};

// ─── SMS via Fast2SMS (India - Recommended for Indian numbers) ────────────────
const sendSMSFast2SMS = async (phone, message) => {
  if (!process.env.FAST2SMS_API_KEY) throw new Error('Fast2SMS API key not configured');

  // Remove country code for Fast2SMS
  const cleanPhone = phone.replace(/^\+91/, '').replace(/\D/g, '');

  const response = await axios.post(
    'https://www.fast2sms.com/dev/bulkV2',
    {
      route: 'q', // Quick SMS (transactional)
      message: message,
      language: 'english',
      flash: 0,
      numbers: cleanPhone,
    },
    {
      headers: {
        authorization: process.env.FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
      },
    }
  );

  if (response.data.return === true) {
    return { success: true, requestId: response.data.request_id, provider: 'fast2sms' };
  }
  throw new Error(response.data.message || 'Fast2SMS failed');
};

// ─── WhatsApp via Twilio ─────────────────────────────────────────────────────
const sendWhatsAppTwilio = async (phone, message) => {
  const client = getTwilioClient();
  // Ensure phone has country code
  const toNumber = phone.startsWith('+') ? phone : `+91${phone}`;
  const result = await client.messages.create({
    body: message,
    from: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
    to: `whatsapp:${toNumber}`,
  });
  return { success: true, sid: result.sid, provider: 'twilio-whatsapp' };
};

// ─── Main exported functions ─────────────────────────────────────────────────

/**
 * Send SMS - auto-selects provider based on env config
 * @param {string} phone - Phone number (with or without +91)
 * @param {string} message - SMS message text
 */
const sendSMS = async (phone, message) => {
  try {
    // Prefer Fast2SMS for India (cheaper), fallback to Twilio
    if (process.env.FAST2SMS_API_KEY) {
      return await sendSMSFast2SMS(phone, message);
    } else if (process.env.TWILIO_ACCOUNT_SID) {
      return await sendSMSTwilio(phone, message);
    } else {
      console.warn('⚠️  No SMS provider configured. Message not sent:', message);
      return { success: false, reason: 'No SMS provider configured' };
    }
  } catch (error) {
    console.error('SMS Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send WhatsApp message via Twilio
 * @param {string} phone - Phone number with country code
 * @param {string} message - WhatsApp message text
 */
const sendWhatsApp = async (phone, message) => {
  try {
    if (process.env.TWILIO_ACCOUNT_SID) {
      return await sendWhatsAppTwilio(phone, message);
    } else {
      console.warn('⚠️  No WhatsApp provider configured. Message not sent:', message);
      return { success: false, reason: 'No WhatsApp provider configured' };
    }
  } catch (error) {
    console.error('WhatsApp Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send both SMS and WhatsApp
 */
const sendNotification = async (phone, message) => {
  const [smsResult, waResult] = await Promise.allSettled([
    sendSMS(phone, message),
    sendWhatsApp(phone, message),
  ]);
  return { sms: smsResult.value, whatsapp: waResult.value };
};

// ─── Message Templates ───────────────────────────────────────────────────────
const templates = {
  welcome: (name, username, password, course) =>
    `🎓 Welcome to Vidya Niketan Education Centre!\n\nHello ${name},\nYour enrollment is confirmed.\n\n📚 Course: ${course}\n👤 Username: ${username}\n🔑 Password: ${password}\n\nLogin: [your-app-url]\n\n- Vidya Niketan Team`,

  attendancePresent: (name, date) =>
    `✅ Attendance Update\n\nHello ${name}, your attendance for ${date} has been marked as PRESENT.\n\n- Vidya Niketan Education Centre`,

  attendanceAbsent: (name, date) =>
    `⚠️ Attendance Update\n\nHello ${name}, your attendance for ${date} has been marked as ABSENT. Please inform if there's an issue.\n\n- Vidya Niketan Education Centre`,

  feeDue: (name, amount, dueDate) =>
    `💰 Fee Reminder\n\nHello ${name}, your fee of ₹${amount} is due on ${dueDate}. Please pay soon to avoid inconvenience.\n\n- Vidya Niketan Education Centre`,

  feeReceived: (name, amount, receiptNo) =>
    `✅ Payment Received\n\nHello ${name}, your payment of ₹${amount} has been received.\nReceipt: ${receiptNo}\n\nThank you!\n- Vidya Niketan Education Centre`,

  announcement: (name, title, message) =>
    `📢 Announcement\n\nHello ${name},\n\n${title}\n${message}\n\n- Vidya Niketan Education Centre`,
};

module.exports = { sendSMS, sendWhatsApp, sendNotification, templates };
