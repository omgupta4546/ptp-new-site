import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user:  null,

      // Set JWT token and user info after login
      setAuth: (token, user) => set({ token, user }),

      // Store verified token from OTP step (short-lived, for set-password)
      verifiedToken: null,
      setVerifiedToken: (verifiedToken) => set({ verifiedToken }),

      // Clear all auth state (logout)
      logout: () => set({ token: null, user: null, verifiedToken: null }),

      // Check if user is authenticated
      isAuthenticated: () => {
        const state = useAuthStore.getState();
        return !!state.token;
      },
    }),
    {
      name: 'rtu-auth',           // localStorage key
      partialize: (state) => ({   // only persist token & user, not verifiedToken
        token: state.token,
        user:  state.user,
      }),
    }
  )
);

export default useAuthStore;
