const multer = require('multer');

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg', 'image/png', 'image/webp',
];

const upload = multer({
  storage: multer.memoryStorage(), // buffer stays in memory just long enough to stream to Cloudinary
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB — comfortable for PDFs/notes, keeps free-tier usage sane
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, Word, PowerPoint, Excel, or image files are allowed'));
  },
});

module.exports = upload;
