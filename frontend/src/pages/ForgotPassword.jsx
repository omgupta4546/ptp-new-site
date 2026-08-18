import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      return toast.error('Please enter your registered student email address.');
    }

    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim());
      setSubmitted(true);
      toast.success('Password reset link sent! Check your inbox.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to request password reset. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg flex items-center justify-center p-4">
      {/* Decorative Blur elements */}
      <div className="absolute top-10 left-10 w-24 h-24 bg-rtu-gold/10 rounded-full blur-2xl animate-pulse-slow" />
      <div className="absolute bottom-10 right-10 w-28 h-28 bg-white/5 rounded-full blur-3xl animate-pulse-slow" />

      <div className="w-full max-w-md animate-slide-up">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 mb-4 shadow-rtu">
            <KeyRound className="w-8 h-8 text-rtu-gold" />
          </div>
          <h1 className="text-2xl font-black text-white font-display">
            RTU Placement Cell
          </h1>
          <p className="text-blue-200 text-sm mt-1">
            Student Account Password Recovery
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-gray-800">Forgot Student Password?</h2>
            <p className="text-xs text-gray-500 mt-1">
              Enter your official registered email and we'll send you a secure link to reset your password.
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label htmlFor="forgot-email" className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Registered Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    required
                    disabled={loading}
                    className="input-field input-icon-left"
                    autoFocus
                  />
                </div>
              </div>

              {/* Spam Notice */}
              <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-xl text-xs text-amber-800 leading-relaxed">
                📌 <strong>Notice:</strong> Please check your <strong>Spam / Junk</strong> folder if you do not see the email in your primary inbox.
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="btn-primary flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending Reset Link...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4 animate-fade-in">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                <Mail className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-850 text-base">Reset Link Sent Successfully!</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                A secure password reset link has been dispatched to <strong>{email}</strong>. 
                Please inspect your inbox as well as your spam/junk folder.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-rtu-blue font-bold hover:underline"
                >
                  Didn't receive it? Request another link
                </button>
              </div>
            </div>
          )}

          {/* Navigation back */}
          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-400">
            <Link
              to="/login"
              className="text-rtu-blue hover:underline"
            >
              ← Back to Student Login
            </Link>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">
              Student Portal
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
