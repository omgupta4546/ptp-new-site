import axios from 'axios';
import useAuthStore from '../store/authStore';
import useAdminStore from '../store/adminStore';

let baseURL = import.meta.env.VITE_API_URL || '/api';
if (baseURL !== '/api' && !baseURL.endsWith('/api') && !baseURL.endsWith('/api/')) {
  baseURL = baseURL.endsWith('/') ? `${baseURL}api` : `${baseURL}/api`;
}

// Configure default baseURL for all raw axios calls (e.g. in Admin.jsx / AttendanceControl.jsx)
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL || '';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request interceptor — attach student JWT ──────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // If it's an admin request, attach admin token
    if (config.url?.startsWith('/admin')) {
      const adminToken = useAdminStore.getState().adminToken;
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
      return config;
    }

    // Otherwise attach student token
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle 401 ────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If it's an admin request
      if (error.config?.url?.startsWith('/admin')) {
        useAdminStore.getState().logoutAdmin();
        if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
      } else {
        // Token expired or invalid for student — log out
        useAuthStore.getState().logout();
        if (window.location.pathname === '/dashboard') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  checkEmail:     (email)            => api.post('/auth/check-email',   { email }),
  sendOTP:        (email)            => api.post('/auth/send-otp',       { email }),
  resendOTP:      (email)            => api.post('/auth/resend-otp',     { email }),
  verifyOTP:      (email, otp)       => api.post('/auth/verify-otp',     { email, otp }),
  setPassword:    (password, token)  =>
    api.post('/auth/set-password', { password }, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  login:          (email, password)  => api.post('/auth/login',          { email, password }),
};

// ── Student API ───────────────────────────────────────────────────────────────
export const studentAPI = {
  getProfile:        ()       => api.get('/student/me'),
  reportDiscrepancy: (data)   => api.post('/student/discrepancy', data),
  refreshData:       ()       => api.post('/student/refresh-data'),
};

// ── Admin API ─────────────────────────────────────────────────────────────────
export const adminAPI = {
  adminLogin:              (username, password) => api.post('/admin/login', { username, password }),
  getDiscrepancies:        ()                   => api.get('/admin/discrepancies'),
  updateDiscrepancyStatus: (id, status, adminNote) =>
    api.patch(`/admin/discrepancies/${id}`, { status, adminNote }),
};

export default api;
