import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Render's free tier "sleeps" the backend after ~15 min of inactivity, and the first
// request to wake it up can take 30-50+ seconds. If the network gives up before that,
// GET requests would fail with a generic network error. Give GET requests a generous
// timeout and retry once after a short wait, so a slow cold-start doesn't look like a
// real failure to the student/admin.
const COLD_START_TIMEOUT_MS = 60000;

const api = axios.create({ baseURL: API_BASE, timeout: COLD_START_TIMEOUT_MS });

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vn_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Handle 401 globally + retry GET requests once on network/timeout errors (likely a cold start)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    const isNetworkOrTimeout = !error.response; // no response at all = network error, timeout, or server was asleep
    const isGet = (config.method || 'get').toLowerCase() === 'get';

    if (isNetworkOrTimeout && isGet && !config._retried) {
      config._retried = true;
      await wait(3000); // give the free-tier instance a few seconds to finish waking up
      try {
        return await api(config);
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }

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
