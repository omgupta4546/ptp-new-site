import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      return toast.error('Please enter administrator email address.');
    }

    setLoading(true);
    try {
      await adminAPI.forgotPassword(email.trim());
      setSubmitted(true);
      toast.success('Admin reset link sent to official administrator email!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to request admin password reset.';
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
            Administrator Password Recovery
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 shadow-2xl border border-white/40">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-gray-800">Admin Security Recovery</h2>
            <p className="text-xs text-gray-500 mt-1">
              Enter official administrator email address to receive a password reset link.
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Admin Email Input */}
              <div>
                <label htmlFor="admin-forgot-email" className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Official Admin Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    id="admin-forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="placements@rtu.ac.in"
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
                className="btn-primary flex items-center justify-center gap-2 bg-gradient-to-r from-navy-900 to-navy-800"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Dispatching Admin Reset Link...
                  </>
                ) : (
                  <>
                    Send Admin Reset Link
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4 animate-fade-in">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-850 text-base">Admin Link Dispatched!</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                A password reset link has been dispatched to <strong>{email}</strong>. 
                Please inspect your administrator inbox.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-rtu-blue font-bold hover:underline"
                >
                  Request another link
                </button>
              </div>
            </div>
          )}

          {/* Bottom helper */}
          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-400">
            <Link to="/admin/login" className="text-rtu-blue hover:underline">
              ← Back to Admin Login
            </Link>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">
              Restricted Route
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
