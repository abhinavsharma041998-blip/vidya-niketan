import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: API_BASE });

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vn_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const stored = localStorage.getItem('vn_user');
      const role = stored ? JSON.parse(stored).role : null;
      localStorage.removeItem('vn_token');
      localStorage.removeItem('vn_user');
      window.location.href = role === 'admin' ? '/admin/login' : '/student/login';
    }
    return Promise.reject(error);
  }
);

export default api;
