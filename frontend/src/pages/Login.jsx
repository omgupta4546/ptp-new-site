import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GraduationCap, Mail, Key, LogIn, Loader2, ShieldCheck, Lock } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = location.state?.email || '';

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [course, setCourse] = useState('btech');
  
  const [step, setStep] = useState('login'); // 'login' | 'setPassword'
  const [tempToken, setTempToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      return toast.error('Please enter both email and password.');
    }
    setLoading(true);
    try {
      const res = await authAPI.login(email.trim(), password);
      localStorage.setItem('selectedCourse', course);
      setAuth(res.data.token, res.data.user);
      toast.success('Access granted! Welcome back.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const res = await authAPI.googleLogin(credentialResponse.credential);
      
      if (res.data.requiresPasswordSetup) {
        setTempToken(res.data.tempToken);
        setStep('setPassword');
        toast.success('Google verification successful. Please set a password.');
      } else {
        localStorage.setItem('selectedCourse', course);
        setAuth(res.data.token, res.data.user);
        toast.success('Access granted! Welcome to the portal.');
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google Auth failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters.');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match.');
    
    setLoading(true);
    try {
      const res = await authAPI.setPassword(tempToken, newPassword);
      localStorage.setItem('selectedCourse', course);
      setAuth(res.data.token, res.data.user);
      toast.success('Password set successfully!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg flex items-center justify-center p-4">
      <div className="absolute top-10 left-10 w-24 h-24 bg-rtu-gold/10 rounded-full blur-2xl animate-pulse-slow" />

      <div className="w-full max-w-md animate-slide-up">
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

        <div className="glass-card p-8">
          {step === 'login' ? (
            <>
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">Student Portal</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Login or verify with Google
                </p>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Registered Email</label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="yourname@example.com"
                      required
                      disabled={loading}
                      className="input-field input-icon-left"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
                  <div className="relative flex items-center">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                      className="input-field input-icon-left"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Select Course</label>
                  <div className="relative flex items-center">
                    <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <select
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      disabled={loading}
                      className="input-field input-icon-left appearance-none bg-white cursor-pointer pr-10"
                    >
                      <option value="btech">B.Tech (Bachelor of Technology)</option>
                      <option value="mba">MBA (Master of Business Administration)</option>
                      <option value="mtech">M.Tech (Master of Technology)</option>
                    </select>
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-gray-400">▼</span>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : <><LogIn className="w-4 h-4" /> Login</>}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500 bg-opacity-90 rounded-full">OR First Time Verification</span></div>
              </div>

              <div className="flex flex-col items-center justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error('Google Sign-In failed.')}
                  useOneTap
                  theme="outline"
                  size="large"
                  shape="pill"
                  width="100%"
                  text="signup_with"
                />
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">Set Your Password</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Please create a password for future logins.
                </p>
              </div>

              <form onSubmit={handleSetPassword} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Password</label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      disabled={loading}
                      className="input-field input-icon-left"
                      minLength={6}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm Password</label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      disabled={loading}
                      className="input-field input-icon-left"
                      minLength={6}
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><ShieldCheck className="w-4 h-4" /> Save Password & Login</>}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col gap-3 text-center">
            <div className="pt-2">
              <Link to="/admin/login" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-navy-900 transition font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> T&P Administrator Login →
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-blue-200/80 text-xs mt-6">
          © {new Date().getFullYear()} RTU Kota — Training & Placement Cell • Developed by <span className="font-semibold text-white">Om Gupta</span>
        </p>
      </div>
    </div>
  );
}
