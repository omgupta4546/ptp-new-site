import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GraduationCap, Timer, RotateCcw, Loader2, ShieldCheck } from 'lucide-react';
import OTPInput from '../components/OTPInput';
import useAuthStore from '../store/authStore';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from navigation state
  const email       = location.state?.email || '';
  const studentName = location.state?.studentName || '';

  const setVerifiedToken = useAuthStore((s) => s.setVerifiedToken);

  const [otp, setOtp]             = useState('');
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);

  // Timer: 2 minutes countdown
  const [timeLeft, setTimeLeft]   = useState(120);
  const [canResend, setCanResend] = useState(false);

  // Redirect if no email in state
  useEffect(() => {
    if (!email) {
      toast.error('No email found. Please register first.');
      navigate('/register', { replace: true });
    }
  }, [email, navigate]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Verify OTP
  const handleVerify = useCallback(async (otpValue) => {
    const code = otpValue || otp;
    if (code.length !== 6) {
      toast.error('Please enter all 6 digits.');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.verifyOTP(email, code);
      toast.success(res.data.message);

      // Store the short-lived verified token for the set-password step
      setVerifiedToken(res.data.verifiedToken);

      navigate('/set-password', {
        state: { email, studentName },
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'OTP verification failed.';
      toast.error(msg);
      setOtp('');
    } finally {
      setLoading(false);
    }
  }, [otp, email, navigate, setVerifiedToken, studentName]);

  // Resend OTP
  const handleResend = async () => {
    setResending(true);
    try {
      const res = await authAPI.resendOTP(email);
      toast.success(res.data.message);
      setTimeLeft(120);
      setCanResend(false);
      setOtp('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  // Auto-submit when 6 digits entered
  const handleComplete = (fullOtp) => {
    handleVerify(fullOtp);
  };

  return (
    <div className="auth-bg flex items-center justify-center p-4">
      <div className="absolute top-10 right-10 w-24 h-24 bg-rtu-gold/10 rounded-full blur-2xl animate-pulse-slow" />

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 mb-4 shadow-rtu">
            <GraduationCap className="w-8 h-8 text-rtu-gold" />
          </div>
          <h1 className="text-2xl font-black text-white font-display">Verify OTP</h1>
          <p className="text-blue-200 text-sm mt-1">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {/* Email indicator */}
          <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 rounded-xl border border-blue-100 mb-3">
            <ShieldCheck className="w-4 h-4 text-rtu-blue" />
            <p className="text-xs text-rtu-blue font-medium truncate">
              OTP sent to <strong>{email}</strong>
            </p>
          </div>

          {/* Spam Notice */}
          <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-xl text-xs text-amber-800 mb-6 leading-relaxed">
            📌 <strong>Notice:</strong> Check your <strong>Spam / Junk</strong> folder if you cannot find the OTP email in your primary inbox.
          </div>

          {/* OTP Input */}
          <div className="mb-6">
            <OTPInput
              otp={otp}
              setOtp={setOtp}
              disabled={loading}
              onComplete={handleComplete}
            />
          </div>

          {/* Timer */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Timer className={`w-4 h-4 ${timeLeft > 0 ? 'text-rtu-blue' : 'text-gray-400'}`} />
            <span className={`text-sm font-semibold ${timeLeft > 0 ? 'text-rtu-navy' : 'text-gray-400'}`}>
              {timeLeft > 0
                ? `Expires in ${formatTime(timeLeft)}`
                : 'OTP expired'
              }
            </span>
          </div>

          {/* Verify button */}
          <button
            id="verify-otp-btn"
            onClick={() => handleVerify()}
            disabled={loading || otp.length !== 6}
            className="btn-primary flex items-center justify-center gap-2 mb-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying…
              </>
            ) : (
              'Verify OTP'
            )}
          </button>

          {/* Resend */}
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">Didn't receive the OTP?</p>
            <button
              id="resend-otp-btn"
              onClick={handleResend}
              disabled={!canResend || resending}
              className={`
                inline-flex items-center gap-1.5 text-sm font-semibold transition-colors duration-200
                ${canResend
                  ? 'text-rtu-blue hover:text-rtu-navy cursor-pointer'
                  : 'text-gray-300 cursor-not-allowed'
                }
              `}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              {resending ? 'Resending…' : 'Resend OTP'}
            </button>
          </div>

          {/* Back link */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <Link to="/register" className="text-sm text-gray-500 hover:text-rtu-blue font-medium">
              ← Back to Registration
            </Link>
          </div>
        </div>

        <p className="text-center text-blue-200/60 text-xs mt-6">
          © {new Date().getFullYear()} RTU Kota — Training & Placement Cell
        </p>
      </div>
    </div>
  );
}
