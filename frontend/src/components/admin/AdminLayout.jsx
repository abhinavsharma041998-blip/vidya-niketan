import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, MessageSquare, CalendarCheck,
  CreditCard, Bell, Menu, X, LogOut, Sun, Moon, ChevronRight,
  ClipboardList, BookOpenCheck, UserCog, FolderOpen, Award
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const navItems = [
  { to: '/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard', end: true },
  { to: '/admin/students', icon: <Users size={18} />, label: 'Students' },
  { to: '/admin/teachers', icon: <UserCog size={18} />, label: 'Teachers' },
  { to: '/admin/courses', icon: <BookOpen size={18} />, label: 'Courses' },
  { to: '/admin/queries', icon: <MessageSquare size={18} />, label: 'Queries' },
  { to: '/admin/attendance', icon: <CalendarCheck size={18} />, label: 'Attendance' },
  { to: '/admin/fees', icon: <CreditCard size={18} />, label: 'Fees' },
  { to: '/admin/announcements', icon: <Bell size={18} />, label: 'Announcements' },
  { to: '/admin/manual-results', icon: <Award size={18} />, label: 'Manual Results' },
  { to: '/admin/exams', icon: <ClipboardList size={18} />, label: 'Exams' },
  { to: '/admin/exam-subjects', icon: <BookOpenCheck size={18} />, label: 'Question Bank' },
  { to: '/admin/materials', icon: <FolderOpen size={18} />, label: 'Study Materials' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? '' : 'w-64'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100 dark:border-gray-800">
        <img src="/assets/logo.png" alt="Vidya Niketan" className="w-9 h-9 rounded-xl flex-shrink-0 object-contain" />
        <div className="overflow-hidden">
          <p className="font-montserrat font-bold text-sm text-gray-900 dark:text-white leading-tight truncate">Vidya Niketan</p>
          <p className="text-xs text-blue-600 dark:text-blue-400">Admin Panel</p>
        </div>
        {mobile && <button onClick={() => setSidebarOpen(false)} className="ml-auto text-gray-400"><X size={18} /></button>}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}
            onClick={() => mobile && setSidebarOpen(false)}
            className={({ isActive }) => `sidebar-link text-sm ${isActive ? 'active' : ''}`}>
            {item.icon}
            <span className="flex-1">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800 space-y-1">
        <button onClick={toggle} className="sidebar-link text-sm w-full">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
          <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button onClick={handleLogout} className="sidebar-link text-sm w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex-shrink-0 w-64">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-50 w-64 bg-white dark:bg-gray-900 flex flex-col h-full shadow-xl">
            <Sidebar mobile />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center px-4 sm:px-6 gap-4 flex-shrink-0">
          <button className="lg:hidden text-gray-500" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.[0] || 'A'}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
