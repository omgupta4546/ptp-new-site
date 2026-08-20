import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, User, Lock, Eye, EyeOff, LogIn, Loader2, GraduationCap } from 'lucide-react';
import useAdminStore from '../store/adminStore';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername]         = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);

  const setAdminAuth = useAdminStore((s) => s.setAdminAuth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error('Please enter administrator ID and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await adminAPI.adminLogin(username.trim(), password);
      const { token, admin } = res.data;

      setAdminAuth(token, admin);
      toast.success('Admin authentication verified. Welcome!');
      navigate('/admin', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Admin authentication failed. Please check credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg flex items-center justify-center p-4">
      {/* Background ambient light */}
      <div className="absolute top-10 right-10 w-28 h-28 bg-rtu-gold/15 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-10 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl animate-pulse-slow" />

      <div className="w-full max-w-md animate-slide-up">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 mb-4 shadow-rtu">
            <ShieldCheck className="w-8 h-8 text-rtu-gold" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-black text-white font-display">
              RTU Placement Cell
            </h1>
            <span className="bg-rtu-gold text-rtu-navy text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm">
              Admin
            </span>
          </div>
          <p className="text-blue-200 text-sm mt-1">
            Authorized Personnel & Placement Officer Gateway
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 shadow-2xl border border-white/40">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-gray-800">T&P Admin Verification</h2>
            <p className="text-xs text-gray-500 mt-1">
              Enter official administrator credentials to access student reports
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username / Admin ID */}
            <div>
              <label htmlFor="admin-username" className="block text-xs font-semibold text-gray-600 mb-1.5">
                Admin Username / Email
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin@rtu.ac.in"
                  required
                  disabled={loading}
                  className="input-field input-icon-left"
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Admin Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="admin-password" className="block text-xs font-semibold text-gray-600">
                  Admin Security Password
                </label>
                <Link
                  to="/admin/forgot-password"
                  className="text-xs font-semibold text-rtu-blue hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  required
                  disabled={loading}
                  className="input-field input-icon-both"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="btn-primary flex items-center justify-center gap-2 bg-gradient-to-r from-navy-900 to-navy-800"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying Admin Access…
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Authenticate & Enter Admin Portal
                </>
              )}
            </button>
          </form>

          {/* Bottom helper */}
          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <Link to="/login" className="text-rtu-blue hover:underline font-semibold flex items-center gap-1">
              ← Student Login
            </Link>
            <span className="text-[11px] text-gray-400">Restricted Route</span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-200/80 text-xs mt-6">
          © {new Date().getFullYear()} RTU Kota — Training & Placement Cell • Developed by <span className="font-semibold text-white">Om Gupta</span>
        </p>
      </div>
    </div>
  );
}
