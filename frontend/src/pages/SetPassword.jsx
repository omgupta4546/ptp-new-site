import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GraduationCap, Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import useAuthStore from '../store/authStore';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function SetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const email          = location.state?.email || '';
  const studentName    = location.state?.studentName || '';
  const verifiedToken  = useAuthStore((s) => s.verifiedToken);

  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirm]   = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(false);

  // Redirect if no verified token
  if (!verifiedToken) {
    return (
      <div className="auth-bg flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md w-full text-center animate-slide-up">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Session Expired</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your OTP verification session has expired. Please start the registration process again.
          </p>
          <Link to="/register" className="btn-primary inline-block text-center">
            Go to Registration
          </Link>
        </div>
      </div>
    );
  }

  const isStrongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#])[A-Za-z\d@$!%*?&^#]{8,}$/.test(password);
  const passwordsMatch   = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isStrongPassword) {
      toast.error('Password does not meet the strength requirements.');
      return;
    }
    if (!passwordsMatch) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.setPassword(password, verifiedToken);
      toast.success(res.data.message);
      // Clear the verifiedToken
      useAuthStore.getState().setVerifiedToken(null);
      navigate('/login', { state: { justRegistered: true, email } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg flex items-center justify-center p-4">
      <div className="absolute bottom-10 left-10 w-28 h-28 bg-rtu-gold/10 rounded-full blur-2xl animate-pulse-slow" />

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 mb-4 shadow-rtu">
            <GraduationCap className="w-8 h-8 text-rtu-gold" />
          </div>
          <h1 className="text-2xl font-black text-white font-display">Set Your Password</h1>
          <p className="text-blue-200 text-sm mt-1">
            Create a strong password to secure your account
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {/* Welcome */}
          {studentName && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 rounded-xl border border-emerald-100 mb-6">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="text-xs text-emerald-700 font-medium">
                Welcome, <strong>{studentName}</strong>! Your email has been verified.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Password */}
            <div>
              <label htmlFor="set-password" className="block text-xs font-semibold text-gray-600 mb-1.5">
                New Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="set-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
                  disabled={loading}
                  className="input-field input-icon-both"
                  autoFocus
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
              <PasswordStrengthMeter password={password} />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm-password" className="block text-xs font-semibold text-gray-600 mb-1.5">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  disabled={loading}
                  className="input-field input-icon-both"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && (
                <p className={`text-xs mt-1.5 flex items-center gap-1 ${passwordsMatch ? 'text-emerald-600' : 'text-red-500'}`}>
                  {passwordsMatch ? (
                    <><CheckCircle className="w-3 h-3" /> Passwords match</>
                  ) : (
                    '✕ Passwords do not match'
                  )}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              id="set-password-btn"
              type="submit"
              disabled={loading || !isStrongPassword || !passwordsMatch}
              className="btn-gold flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Setting Password…
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Set Password & Continue
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-blue-200/60 text-xs mt-6">
          © {new Date().getFullYear()} RTU Kota — Training & Placement Cell
        </p>
      </div>
    </div>
  );
}
