import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function TeacherLoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const { teacherLogin, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await teacherLogin(form.username, form.password);
    if (result.success) navigate('/teacher');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '48px 48px' }} />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <img src="/assets/logo.png" alt="Vidya Niketan" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-montserrat font-bold text-white">Teacher Portal</h1>
          <p className="text-purple-300 text-sm mt-1">Vidya Niketan Education Centre</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-white mb-6">Login to your account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1.5">Teacher Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300 w-4 h-4" />
                <input className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="e.g. priya.sharma" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300 w-4 h-4" />
                <input className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-white text-purple-900 font-bold py-2.5 rounded-xl hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 mt-2">
              {loading ? <span className="animate-spin w-4 h-4 border-2 border-purple-900 border-t-transparent rounded-full" /> : null}
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <p className="text-purple-300 text-xs text-center mt-4">Contact admin if you forgot your credentials</p>
        </div>
        <div className="text-center mt-6">
          <Link to="/" className="text-purple-300 text-sm hover:text-white transition-colors">← Back to Website</Link>
          <span className="text-purple-600 mx-3">|</span>
          <Link to="/admin/login" className="text-purple-300 text-sm hover:text-white transition-colors">Admin Login</Link>
        </div>
      </div>
    </div>
  );
}
