import { useState, useEffect } from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import { Menu, X, Moon, Sun, GraduationCap, ChevronUp } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function PublicLayout() {
  const { dark, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [preloader, setPreloader] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setPreloader(false), 1800);
    const onScroll = () => { setScrolled(window.scrollY > 50); setShowTop(window.scrollY > 400); };
    window.addEventListener('scroll', onScroll);
    return () => { clearTimeout(timer); window.removeEventListener('scroll', onScroll); };
  }, []);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/courses', label: 'Courses' },
    { to: '/about', label: 'About Us' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <>
      {/* Preloader */}
      <div className={`preloader ${preloader ? '' : 'hidden'}`}>
        <div className="text-center">
          <div className="preloader-logo mb-2">VN</div>
          <p className="text-blue-200 text-sm font-poppins">Vidya Niketan Education Centre</p>
          <div className="mt-4 flex gap-1 justify-center">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 dark:bg-gray-950/95 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-gray-800' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-montserrat font-bold text-gray-900 dark:text-white text-sm leading-tight">Vidya Niketan</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Education Centre</div>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <NavLink key={link.to} to={link.to} end={link.to === '/'}
                  className={({ isActive }) => `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  {link.label}
                </NavLink>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button onClick={toggle} className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <Link to="/student/login" className="hidden sm:block text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                Student Login
              </Link>
              <Link to="/admin/login" className="hidden sm:block btn-primary text-sm py-2 px-4">
                Admin
              </Link>
              <button className="md:hidden p-2 rounded-lg" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white dark:bg-gray-950 border-t dark:border-gray-800 px-4 py-3 space-y-1">
            {navLinks.map(link => (
              <NavLink key={link.to} to={link.to} end={link.to === '/'} onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `block px-4 py-2.5 rounded-xl text-sm font-medium ${isActive ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-600 dark:text-gray-300'}`}>
                {link.label}
              </NavLink>
            ))}
            <div className="flex gap-2 pt-2 border-t dark:border-gray-800">
              <Link to="/student/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center btn-secondary text-sm py-2">Student Login</Link>
              <Link to="/admin/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center btn-primary text-sm py-2">Admin</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="page-enter">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-300 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-montserrat font-bold text-white text-sm">Vidya Niketan</div>
                  <div className="text-xs text-blue-400">Education Centre</div>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">Shape your future with quality computer education. Your success is our mission.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                {['Home', 'Courses', 'About Us', 'Contact'].map(l => (
                  <li key={l}><Link to={l === 'Home' ? '/' : `/${l.toLowerCase().replace(' ', '-')}`} className="hover:text-blue-400 transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Courses</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {['DCA', 'PGDCA', 'Basic Computer', 'Web Development', 'Tally & Accounting'].map(c => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>📍 Vidya Niketan Education Centre, Near Talwara By-Pass, Above Gramin Bank, Chintpurni</li>
                <li>📞 7018935693 / 8894424919</li>
                <li>✉️ vidyaniketaneducation108@gmail.com</li>
                <li>🕐 Mon-Sat: 9AM - 6PM</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Vidya Niketan Education Centre. All rights reserved.</p>
            <div className="flex gap-4">
              <Link to="/student/login" className="hover:text-blue-400 transition-colors">Student Portal</Link>
              <Link to="/admin/login" className="hover:text-blue-400 transition-colors">Admin Panel</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp float */}
      <a href="https://wa.me/917018935693" target="_blank" rel="noopener noreferrer" className="whatsapp-float" title="Chat on WhatsApp">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* Back to top */}
      {showTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-6 w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-40 hover:-translate-y-1">
          <ChevronUp size={20} />
        </button>
      )}
    </>
  );
}
