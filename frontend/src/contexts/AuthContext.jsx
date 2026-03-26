import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('vn_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const adminLogin = async (username, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/admin/login', { username, password });
      localStorage.setItem('vn_token', data.token);
      localStorage.setItem('vn_user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const studentLogin = async (username, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/student/login', { username, password });
      localStorage.setItem('vn_token', data.token);
      localStorage.setItem('vn_user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success(`Welcome, ${data.user.name}!`);
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('vn_token');
    localStorage.removeItem('vn_user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, loading, adminLogin, studentLogin, logout, isAdmin: user?.role === 'admin', isStudent: user?.role === 'student' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
