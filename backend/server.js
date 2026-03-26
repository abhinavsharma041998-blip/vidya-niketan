require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const Admin = require('./models/Admin');
const Course = require('./models/Course');

const app = express();
connectDB();

app.use(helmet());
app.use(cors({ origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:5173'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
app.use('/api', limiter);
app.use('/api/admin/login', authLimiter);
app.use('/api/student/login', authLimiter);

app.use('/api', require('./routes/index'));
app.get('/health', (req, res) => res.json({ status: 'OK', app: 'Vidya Niketan API' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

const seedData = async () => {
  try {
    const adminExists = await Admin.findOne({ username: process.env.ADMIN_USERNAME || 'admin' });
    if (!adminExists) {
      await Admin.create({ username: process.env.ADMIN_USERNAME || 'admin', password: process.env.ADMIN_PASSWORD || 'Admin@123', name: 'Administrator' });
      console.log('Default admin created: admin / Admin@123');
    }
    const courseCount = await Course.countDocuments();
    if (courseCount === 0) {
      await Course.insertMany([
        { name: 'Basic Computer Course', code: 'BCC', description: 'Fundamentals of computers, MS Office, Internet & Email', duration: '3 Months', durationMonths: 3, fees: 3000, category: 'Basic', syllabusTopics: ['Computer Basics', 'MS Word', 'MS Excel', 'Internet', 'Email'] },
        { name: 'DCA', code: 'DCA', description: 'Diploma in Computer Applications - comprehensive course covering all major computer applications', duration: '6 Months', durationMonths: 6, fees: 6000, category: 'Intermediate', syllabusTopics: ['MS Office', 'Tally', 'Internet', 'HTML Basics', 'Programming Basics'] },
        { name: 'PGDCA', code: 'PGDCA', description: 'Post Graduate Diploma in Computer Applications - advanced professional course', duration: '12 Months', durationMonths: 12, fees: 12000, category: 'Professional', syllabusTopics: ['Advanced Programming', 'Database Management', 'Web Development', 'Networking', 'Project Work'] },
        { name: 'Advanced Web Development', code: 'AWD', description: 'HTML, CSS, JavaScript, React - full-stack web developer course', duration: '6 Months', durationMonths: 6, fees: 8000, category: 'Advanced', syllabusTopics: ['HTML5', 'CSS3', 'JavaScript', 'React', 'Node.js Basics'] },
        { name: 'Tally & Accounting', code: 'TALLY', description: 'Complete Tally ERP 9 & Tally Prime with GST', duration: '3 Months', durationMonths: 3, fees: 4000, category: 'Intermediate', syllabusTopics: ['Tally Prime', 'GST', 'Accounting Basics', 'Balance Sheet', 'Payroll'] },
      ]);
      console.log('Default courses seeded');
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
};

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Vidya Niketan API running on port ${PORT}`);
  await seedData();
});

module.exports = app;
