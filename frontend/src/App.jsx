import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Public pages
import PublicLayout from './components/public/PublicLayout';
import HomePage from './pages/public/HomePage';
import CoursesPage from './pages/public/CoursesPage';
import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';

// Auth pages
import AdminLoginPage from './pages/AdminLoginPage';
import StudentLoginPage from './pages/StudentLoginPage';

// Admin pages
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentsPage from './pages/admin/StudentsPage';
import AdminCoursesPage from './pages/admin/AdminCoursesPage';
import QueriesPage from './pages/admin/QueriesPage';
import AttendancePage from './pages/admin/AttendancePage';
import FeesPage from './pages/admin/FeesPage';
import AnnouncementsPage from './pages/admin/AnnouncementsPage';

// Student pages
import StudentLayout from './components/student/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAttendancePage from './pages/student/StudentAttendancePage';
import StudentFeesPage from './pages/student/StudentFeesPage';

const ProtectedAdmin = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

const ProtectedStudent = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/student/login" replace />;
  if (user.role !== 'student') return <Navigate to="/student/login" replace />;
  return children;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '12px', fontFamily: 'Poppins' } }} />
          <Routes>
            {/* Public */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="courses" element={<CoursesPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="contact" element={<ContactPage />} />
            </Route>

            {/* Auth */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/student/login" element={<StudentLoginPage />} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedAdmin><AdminLayout /></ProtectedAdmin>}>
              <Route index element={<AdminDashboard />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="courses" element={<AdminCoursesPage />} />
              <Route path="queries" element={<QueriesPage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="fees" element={<FeesPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
            </Route>

            {/* Student */}
            <Route path="/student" element={<ProtectedStudent><StudentLayout /></ProtectedStudent>}>
              <Route index element={<StudentDashboard />} />
              <Route path="attendance" element={<StudentAttendancePage />} />
              <Route path="fees" element={<StudentFeesPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
