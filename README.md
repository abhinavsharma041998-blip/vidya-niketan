# 🎓 Vidya Niketan Education Centre — Full-Stack ERP System

A complete production-ready institute management system with public website, admin ERP panel, student portal, and SMS/WhatsApp notifications.

---

## 📁 Project Structure

```
vidya-niketan/
├── backend/                   # Node.js + Express API
│   ├── config/db.js           # MongoDB connection
│   ├── controllers/           # Business logic
│   │   ├── authController.js
│   │   ├── studentController.js
│   │   ├── courseController.js
│   │   ├── attendanceController.js
│   │   ├── feesController.js
│   │   ├── queryController.js
│   │   ├── notificationController.js
│   │   └── dashboardController.js
│   ├── middleware/auth.js      # JWT middleware
│   ├── models/                # Mongoose schemas
│   │   ├── Admin.js
│   │   ├── Student.js
│   │   ├── Course.js
│   │   ├── Attendance.js
│   │   ├── Fees.js
│   │   ├── Query.js
│   │   └── Announcement.js
│   ├── routes/index.js        # All API routes
│   ├── services/
│   │   └── notificationService.js  # SMS + WhatsApp
│   ├── server.js              # Entry point
│   ├── .env.example           # Environment template
│   └── package.json
│
└── frontend/                  # React + Vite + Tailwind
    ├── src/
    │   ├── components/
    │   │   ├── public/PublicLayout.jsx    # Website navbar + footer
    │   │   ├── admin/AdminLayout.jsx      # Admin sidebar
    │   │   └── student/StudentLayout.jsx  # Student sidebar
    │   ├── contexts/
    │   │   ├── AuthContext.jsx
    │   │   └── ThemeContext.jsx
    │   ├── pages/
    │   │   ├── public/                    # Homepage, Courses, About, Contact
    │   │   ├── admin/                     # Dashboard, Students, Fees, etc.
    │   │   └── student/                   # Student dashboard, attendance, fees
    │   ├── utils/api.js                   # Axios with JWT
    │   ├── App.jsx                        # Router setup
    │   ├── main.jsx
    │   └── index.css                      # Tailwind + custom styles
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## ⚙️ Local Setup

### Step 1 — Prerequisites

```bash
node --version   # v18+ required
npm --version    # v9+ recommended
```

### Step 2 — Clone & Install

```bash
# Backend
cd vidya-niketan/backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 3 — Configure Environment

```bash
cd backend
cp .env.example .env
# Open .env and fill in your values
```

**Required `.env` values:**
```
PORT=5000
MONGODB_URI=mongodb+srv://...  ← from MongoDB Atlas
JWT_SECRET=some_long_random_secret_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin@123
FRONTEND_URL=http://localhost:3000
```

**Optional (for notifications):**
```
# Fast2SMS (recommended for India)
FAST2SMS_API_KEY=your_key

# OR Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### Step 4 — Run Locally

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# API running at http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm run dev
# Website at http://localhost:3000
```

### Step 5 — Default Login

On first run, admin is auto-created:
- **URL:** http://localhost:3000/admin/login
- **Username:** `admin`
- **Password:** `Admin@123`

> ⚠️ Change the password immediately after first login!

---

## 🗄️ MongoDB Atlas Setup

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a **database user** (username + password)
4. Under **Network Access** → Add your IP (or `0.0.0.0/0` for all)
5. Click **Connect** → **Connect your application** → Copy the URI
6. Replace `<username>` and `<password>` in the URI
7. Paste into your `.env` as `MONGODB_URI`

---

## 📱 Notification Setup

### Option A: Fast2SMS (Recommended for India — Cheaper)

1. Register at [fast2sms.com](https://www.fast2sms.com/)
2. Get API key from dashboard
3. Add to `.env`: `FAST2SMS_API_KEY=your_key`

### Option B: Twilio (SMS + WhatsApp)

1. Sign up at [twilio.com](https://www.twilio.com/) (free trial available)
2. Get Account SID, Auth Token, Phone Number
3. For WhatsApp: Enable Twilio Sandbox for WhatsApp
4. Add all keys to `.env`

The system auto-detects which provider to use based on which keys are present.

---

## 🚀 Deployment

### Backend → Render.com (Free)

1. Push backend folder to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
5. Add all `.env` variables in the Render dashboard
6. Deploy! You'll get a URL like `https://vidya-niketan-api.onrender.com`

### Frontend → Vercel (Free)

1. Push frontend folder to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your repo
4. Add environment variable:
   - `VITE_API_URL` = `https://your-render-url.onrender.com/api`
5. Deploy! You'll get `https://vidya-niketan.vercel.app`

### Alternative: Railway.app (Backend)

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Add environment variables
4. Railway auto-detects Node.js

---

## 🔐 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login → returns JWT |
| POST | `/api/student/login` | Student login → returns JWT |

### Dashboard
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/dashboard` | Admin |

### Students
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/students` | Admin |
| POST | `/api/students` | Admin |
| PUT | `/api/students/:id` | Admin |
| DELETE | `/api/students/:id` | Admin |
| GET | `/api/students/me` | Student |

### Courses
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/courses` | Public |
| POST | `/api/courses` | Admin |
| PUT | `/api/courses/:id` | Admin |
| DELETE | `/api/courses/:id` | Admin |

### Attendance
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/attendance` | Admin |
| GET | `/api/attendance` | Admin |
| GET | `/api/attendance/me` | Student |

### Fees
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/fees` | Admin |
| GET | `/api/fees` | Admin |
| PUT | `/api/fees/:id` | Admin |
| GET | `/api/fees/me` | Student |

### Notifications
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/notify/sms` | Admin |
| POST | `/api/notify/whatsapp` | Admin |
| POST | `/api/notify/announce` | Admin |

---

## 🔮 Future Scalability

This project is structured for easy expansion:

| Feature | What to add |
|---------|-------------|
| **Payment Gateway** | Razorpay/Stripe integration in `feesController.js` |
| **Result System** | New `Result` model + routes |
| **Online Classes** | Zoom/Meet API integration |
| **Mobile App** | Same backend APIs work with React Native |
| **Timetable** | New `Schedule` model |
| **Certificates** | PDF generation with `pdfkit` |

---

## 🛡️ Security Features

- ✅ JWT authentication (7-day expiry)
- ✅ Password hashing with bcryptjs (12 rounds)
- ✅ Rate limiting (200 req/15min, 10 login attempts/15min)
- ✅ CORS protection
- ✅ Helmet.js HTTP headers
- ✅ Protected routes (Admin/Student separation)
- ✅ Environment variables for all secrets
- ✅ Input validation

---

## 📞 Support

To customize the institute details, update these files:
- `frontend/src/components/public/PublicLayout.jsx` — Address, phone in footer
- `backend/.env` — Institute name, admin credentials

**Replace `[ADD]` placeholders with your real information before deploying.**
