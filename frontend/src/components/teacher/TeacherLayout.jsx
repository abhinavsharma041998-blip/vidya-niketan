import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileUp, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function TeacherLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/teacher/login'); };

  const navItems = [
    { to: '/teacher', icon: <LayoutDashboard size={18} />, label: 'Dashboard', end: true },
    { to: '/teacher/materials', icon: <FileUp size={18} />, label: 'Study Materials' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-50 lg:z-auto w-64 h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col transition-transform duration-300 shadow-xl lg:shadow-none`}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100 dark:border-gray-800">
          <img src="/assets/logo.png" alt="Vidya Niketan" className="w-9 h-9 rounded-xl flex-shrink-0 object-contain" />
          <div>
            <p className="font-montserrat font-bold text-sm text-gray-900 dark:text-white">Teacher Portal</p>
            <p className="text-xs text-purple-600">Vidya Niketan</p>
          </div>
          <button className="lg:hidden ml-auto text-gray-400" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>

        {/* Teacher info */}
        <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            {user?.photo ? (
              <img src={user.photo} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">{user?.name?.[0]}</div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.subject || (user?.course?.name ? `${user.course.name} · Teacher` : 'All Courses')}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setOpen(false)}
              className={({ isActive }) => `sidebar-link text-sm ${isActive ? 'active !text-purple-600 dark:!text-purple-400 !bg-purple-50 dark:!bg-purple-900/20' : ''}`}>
              {item.icon} <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800">
          <button onClick={handleLogout} className="sidebar-link text-sm w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"><LogOut size={18} /> Logout</button>
        </div>
      </aside>

      {open && <div className="lg:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center px-4 sm:px-6 gap-4">
          <button className="lg:hidden text-gray-500" onClick={() => setOpen(true)}><Menu size={22} /></button>
          <span className="text-sm text-gray-500 hidden sm:block">Welcome back, <span className="font-semibold text-gray-900 dark:text-white">{user?.name}</span>!</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
