const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');

// Only a genuine JWT problem (bad signature, malformed, expired) means the token itself
// is invalid and the user should be logged out. Anything else (a DB hiccup while looking
// up the user, a Mongo connection blip, etc.) is a *server-side* problem — the token is
// still fine, so we must NOT return 401 for those, or the frontend will force-logout a
// perfectly logged-in user (this was happening mid-exam whenever Mongo had a brief hiccup).

// ─── Protect Admin Routes ─────────────────────────────────────────────────────
const protectAdmin = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
  if (decoded.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access only' });

  try {
    req.admin = await Admin.findById(decoded.id).select('-password');
    if (!req.admin) return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    next();
  } catch (err) {
    // DB/network error — token itself was valid, so don't log the user out. Ask them to retry.
    console.error('protectAdmin DB error:', err.message);
    res.status(503).json({ success: false, message: 'Temporary server issue, please try again' });
  }
};

// ─── Protect Student Routes ───────────────────────────────────────────────────
const protectStudent = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
  if (decoded.role !== 'student') return res.status(403).json({ success: false, message: 'Student access only' });

  try {
    req.student = await Student.findById(decoded.id).select('-password').populate('course');
    if (!req.student) return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    next();
  } catch (err) {
    console.error('protectStudent DB error:', err.message);
    res.status(503).json({ success: false, message: 'Temporary server issue, please try again' });
  }
};

// ─── Protect Either (Admin or Student) ───────────────────────────────────────
const protectAny = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = { protectAdmin, protectStudent, protectAny };
