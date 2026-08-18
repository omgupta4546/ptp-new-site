import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { authAPI, adminAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const role  = searchParams.get('role') || 'student'; // 'student' | 'admin'

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing password reset token.');
      setTokenValid(false);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tokenValid || !token) {
      toast.error('Cannot reset password without a valid reset link.');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      if (role === 'admin') {
        await adminAPI.resetPassword(password, token);
      } else {
        await authAPI.resetPassword(password, token);
      }
      setSuccess(true);
      toast.success('Password updated successfully!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password. The link may have expired.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg flex items-center justify-center p-4">
      {/* Decorative Lights */}
      <div className="absolute top-10 right-10 w-24 h-24 bg-rtu-gold/10 rounded-full blur-2xl animate-pulse-slow" />
      <div className="absolute bottom-10 left-10 w-28 h-28 bg-white/5 rounded-full blur-3xl animate-pulse-slow" />

      <div className="w-full max-w-md animate-slide-up">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 mb-4 shadow-rtu">
            <Lock className="w-8 h-8 text-rtu-gold" />
          </div>
          <h1 className="text-2xl font-black text-white font-display">
            RTU Placement Cell
          </h1>
          <p className="text-blue-200 text-sm mt-1">
            Secure Password Manager
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card p-8">
          {!success ? (
            <>
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">Set New Password</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Choose a strong password containing at least 8 characters for your {role} account.
                </p>
              </div>

              {!tokenValid ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto border border-rose-100">
                    <AlertCircle className="w-6 h-6 text-rose-600" />
                  </div>
                  <h3 className="font-bold text-gray-850 text-base">Invalid or Expired Link</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    This password reset link is invalid, malformed, or has expired after its 15-minute validity window.
                  </p>
                  <div className="pt-2">
                    <Link
                      to={`/forgot-password?role=${role}`}
                      className="btn-primary block text-center py-2.5 rounded-xl font-bold"
                    >
                      Request a New Link
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* New Password */}
                  <div>
                    <label htmlFor="new-password" className="block text-xs font-semibold text-gray-600 mb-1.5">
                      New Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        required
                        disabled={loading}
                        className="input-field input-icon-both"
                        autoComplete="new-password"
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
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirm-password" className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        id="confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        required
                        disabled={loading}
                        className="input-field input-icon-both"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={loading || !password || !confirmPassword}
                    className="btn-primary flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="text-center space-y-4 py-4 animate-fade-in">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-850 text-base">Password Reset Successfully!</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Your new {role} password has been securely registered in the RTU Placement database. 
                You can now log in to the portal using your new credentials.
              </p>
              <div className="pt-4">
                <Link
                  to={role === 'admin' ? '/admin/login' : '/login'}
                  className="btn-primary block text-center py-2.5 rounded-xl font-bold"
                >
                  Continue to Login
                </Link>
              </div>
            </div>
          )}

          {/* Navigation back */}
          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-400">
            <Link
              to={role === 'admin' ? '/admin/login' : '/login'}
              className="text-rtu-blue hover:underline"
            >
              ← Cancel & Back to Login
            </Link>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">
              {role} Account
            </span>
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
