import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import useAdminStore from './store/adminStore';
import Register    from './pages/Register';
import VerifyOTP   from './pages/VerifyOTP';
import SetPassword from './pages/SetPassword';
import Login       from './pages/Login';
import Dashboard   from './pages/Dashboard';
import Admin       from './pages/Admin';
import AdminLogin  from './pages/AdminLogin';
import AttendanceControl from './pages/AttendanceControl';
import VolunteerScanner from './pages/VolunteerScanner';

// Student Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
};

// Student Public-only route (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const token = useAuthStore((s) => s.token);
  return token ? <Navigate to="/dashboard" replace /> : children;
};

// Admin Protected route wrapper
const AdminProtectedRoute = ({ children }) => {
  const adminToken = useAdminStore((s) => s.adminToken);
  return adminToken ? children : <Navigate to="/admin/login" replace />;
};

// Admin Public-only route (redirect if already logged in as admin)
const AdminPublicRoute = ({ children }) => {
  const adminToken = useAdminStore((s) => s.adminToken);
  return adminToken ? <Navigate to="/admin" replace /> : children;
};

// Super‑admin protected attendance page
const AdminAttendanceRoute = ({ children }) => {
  const adminToken = useAdminStore((s) => s.adminToken);
  return adminToken ? children : <Navigate to="/admin/login" replace />;
};

export default function App() {
  const [hydrated, setHydrated] = useState(useAuthStore.persist.hasHydrated());

  useEffect(() => {
    // If already hydrated
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    // Listen for hydration finish
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    setHydrated(useAuthStore.persist.hasHydrated());
    return () => unsub();
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-rtu-light flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-rtu-navy border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Student Auth Flow */}
      <Route path="/register"     element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/verify-otp"   element={<PublicRoute><VerifyOTP /></PublicRoute>} />
      <Route path="/set-password" element={<PublicRoute><SetPassword /></PublicRoute>} />
      <Route path="/login"        element={<PublicRoute><Login /></PublicRoute>} />

      {/* Student Protected Portal */}
      <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

      {/* Admin Auth Flow */}
      <Route path="/admin/login"  element={<AdminPublicRoute><AdminLogin /></AdminPublicRoute>} />
      <Route path="/admin"        element={<AdminProtectedRoute><Admin /></AdminProtectedRoute>} />

      {/* Attendance routes */}
      <Route path="/admin/attendance" element={<AdminProtectedRoute><AttendanceControl /></AdminProtectedRoute>} />
      <Route path="/attendance/:eventId/:token" element={<VolunteerScanner />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
