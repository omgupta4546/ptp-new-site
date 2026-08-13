import { create } from 'zustand';

const useAdminStore = create((set) => ({
  adminToken: localStorage.getItem('rtu_admin_token') || null,
  adminUser: (() => {
    try {
      const stored = localStorage.getItem('rtu_admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),

  setAdminAuth: (token, admin) => {
    localStorage.setItem('rtu_admin_token', token);
    localStorage.setItem('rtu_admin_user', JSON.stringify(admin));
    set({ adminToken: token, adminUser: admin });
  },

  logoutAdmin: () => {
    localStorage.removeItem('rtu_admin_token');
    localStorage.removeItem('rtu_admin_user');
    set({ adminToken: null, adminUser: null });
  },
}));

export default useAdminStore;
