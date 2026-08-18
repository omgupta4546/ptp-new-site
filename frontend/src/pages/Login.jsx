import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GraduationCap, Mail, Lock, Eye, EyeOff, LogIn, Loader2, CheckCircle, ShieldCheck } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const justRegistered = location.state?.justRegistered || false;
  const initialEmail   = location.state?.email || '';

  const [email, setEmail]               = useState(initialEmail);
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [course, setCourse]             = useState('btech');
  const [loading, setLoading]           = useState(false);

  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.login(email.trim(), password);
      const { token, user } = res.data;

      // Save course selection to localStorage
      localStorage.setItem('selectedCourse', course);

      setAuth(token, user);
      toast.success('Login successful! Welcome to the portal.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg flex items-center justify-center p-4">
      <div className="absolute top-10 left-10 w-24 h-24 bg-rtu-gold/10 rounded-full blur-2xl animate-pulse-slow" />

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 mb-4 shadow-rtu">
            <GraduationCap className="w-8 h-8 text-rtu-gold" />
          </div>
          <h1 className="text-2xl font-black text-white font-display">
            RTU Placement Cell
          </h1>
          <p className="text-blue-200 text-sm mt-1">
            Rajasthan Technical University, Kota
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {justRegistered && (
            <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-100 mb-6">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="text-xs text-emerald-700 font-medium">
                Password created successfully! You can now log in.
              </p>
            </div>
          )}

          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-gray-800">Student Portal Login</h2>
            <p className="text-sm text-gray-500 mt-1">
              Access your verified academic & placement profile
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email input */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-gray-600 mb-1.5">
                Official Email ID
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@example.com"
                  required
                  disabled={loading}
                  className="input-field input-icon-left"
                  autoComplete="email"
                  autoFocus={!initialEmail}
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-semibold text-gray-600">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-rtu-blue hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  className="input-field input-icon-both"
                  autoComplete="current-password"
                  autoFocus={!!initialEmail}
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

            {/* Course selection */}
            <div>
              <label htmlFor="login-course" className="block text-xs font-semibold text-gray-600 mb-1.5">
                Select Course
              </label>
              <div className="relative flex items-center">
                <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  id="login-course"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  disabled={loading}
                  className="input-field input-icon-left appearance-none bg-white cursor-pointer pr-10"
                >
                  <option value="btech">B.Tech (Bachelor of Technology)</option>
                  <option value="mba">MBA (Master of Business Administration)</option>
                  <option value="mtech">M.Tech (Master of Technology)</option>
                </select>
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-gray-400">
                  ▼
                </span>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Logging in…
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Log In
                </>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col gap-3 text-center">
            <p className="text-sm text-gray-500">
              Not registered yet?{' '}
              <Link
                to="/register"
                className="text-rtu-blue font-semibold hover:underline"
              >
                Sign Up
              </Link>
            </p>

            <div className="pt-2">
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-navy-900 transition font-medium"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                T&P Administrator Login →
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-200/60 text-xs mt-6">
          © {new Date().getFullYear()} RTU Kota — Training & Placement Cell
        </p>
      </div>
    </div>
  );
}
