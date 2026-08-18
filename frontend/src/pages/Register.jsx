import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Mail, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate    = useNavigate();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Please enter your email.');

    setLoading(true);
    try {
      // Step 1: Check if email exists in the sheet
      const checkRes = await authAPI.checkEmail(email.trim());
      const data     = checkRes.data;

      if (data.alreadyRegistered) {
        toast('You\'re already registered. Redirecting to login…', { icon: 'ℹ️' });
        navigate('/login');
        return;
      }

      // Step 2: Send OTP
      const otpRes = await authAPI.sendOTP(email.trim());
      toast.success(otpRes.data.message);

      // Navigate to OTP page with email in state
      navigate('/verify-otp', {
        state: {
          email: email.trim(),
          studentName: data.studentName || '',
          expiresAt: otpRes.data.expiresAt,
        },
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg flex items-center justify-center p-4">
      {/* Floating decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-rtu-gold/10 rounded-full blur-2xl animate-pulse-slow" />
      <div className="absolute bottom-20 right-20 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-pulse-slow" />

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo header */}
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
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-gray-800">Student Registration</h2>
            <p className="text-sm text-gray-500 mt-1">
              Enter your official email registered with the T&P Cell
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email input */}
            <div>
              <label htmlFor="register-email" className="block text-xs font-semibold text-gray-600 mb-1.5">
                Official Email ID
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@example.com"
                  required
                  disabled={loading}
                  className="input-field input-icon-left"
                  autoFocus
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Info card */}
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <ShieldCheck className="w-4 h-4 text-rtu-blue mt-0.5 flex-shrink-0" />
              <p className="text-xs text-rtu-blue leading-relaxed">
                A <strong>6-digit OTP</strong> will be sent to your email for verification. Make sure you have access to this email.
              </p>
            </div>

            {/* Spam Notice */}
            <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-xl text-xs text-amber-800 leading-relaxed">
              📌 <strong>Notice:</strong> Please check your <strong>Spam / Junk</strong> folder if you do not see the OTP email in your primary inbox.
            </div>

            {/* Submit */}
            <button
              id="register-submit-btn"
              type="submit"
              disabled={loading || !email.trim()}
              className="btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying Email…
                </>
              ) : (
                <>
                  Send OTP
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already registered?{' '}
              <Link
                to="/login"
                className="text-rtu-blue font-semibold hover:underline"
              >
                Log In
              </Link>
            </p>
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
