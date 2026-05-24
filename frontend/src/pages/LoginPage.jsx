import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { loginUser } from '../services/authService';
import { extractErrors, extractMessage } from '../utils/errorHelpers';
import GovInputField from '../components/GovInputField';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import logoSrc from '../assets/logo.png';

const TopBanner = () => (
  <div className="w-full bg-danger text-white text-xs py-2 px-4 flex items-center justify-center gap-2 font-medium z-50 relative">
    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
    <span>This is an authorized government system. Unauthorized access is strictly prohibited.</span>
  </div>
);

const Emblem = ({ className = "" }) => (
  <img
    src={logoSrc}
    alt="TrafficGuard"
    className={`rounded-full object-cover border-4 border-accent/60 shadow-lg ${className}`}
    style={{ width: 80, height: 80 }}
  />
);

const LeftPanel = () => (
  <div className="hidden md:flex flex-col items-center justify-center w-[45%] bg-primary p-10 relative overflow-hidden text-center shrink-0">
    <Emblem className="mb-6" />
    <h1 className="text-white text-[26px] font-black tracking-tight leading-none mb-1">
      Traffic<span className="text-accent">Guard</span>
    </h1>
    <p className="text-white/60 text-[12px] font-semibold uppercase tracking-widest mb-1">
      Traffic &amp; Accident Management System
    </p>
    <h2 className="text-accent text-[11px] font-bold uppercase tracking-widest mb-10">
      Ministry of Road Transport
    </h2>
    
    <div className="text-left w-full max-w-[280px]">
      <ul className="space-y-4">
        {[
          'Real-time traffic flow monitoring',
          'Automated incident and accident reporting',
          'AI-driven safety insights and analytics'
        ].map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-white text-[12px] leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0"></span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, token, user } = useAuthStore();

  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  useEffect(() => {
    if (token && user) {
      const userRole = user.role ?? user.roles?.[0]?.name ?? 'public_user';
      navigate(userRole === 'admin' ? '/admin/dashboard' : '/user/dashboard', { replace: true });
    }
  }, [token, user, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setGlobalError('');
    try {
      const { data } = await loginUser({ email: form.email, password: form.password });
      const userData = data.data.user;
      const token = data.data.token;
      login(userData, token, form.remember);
      // Role-based redirect
      const userRole = userData.role ?? userData.roles?.[0]?.name ?? 'public_user';
      navigate(userRole === 'admin' ? '/admin/dashboard' : '/user/dashboard', { replace: true });
    } catch (err) {
      const fieldErrors = extractErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      } else {
        setGlobalError(extractMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const eyeOpen = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
  const eyeOff = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopBanner />
      
      <div className="flex flex-1 overflow-hidden">
        <LeftPanel />

        <div className="flex-1 flex flex-col relative w-full md:w-[55%]">
          {/* Top Bar Right Panel */}
          <div className="w-full">
            <div className="bg-primary px-6 py-2 flex items-center justify-between">
              <span className="text-white text-[11px] uppercase tracking-widest font-semibold">Government of India</span>
              <div className="md:hidden flex items-center gap-2">
                <span className="text-accent text-[11px] font-bold uppercase tracking-widest">Ministry of Road Transport</span>
              </div>
            </div>
            {/* Indian Flag Stripe */}
            <div className="h-[3px] w-full flex">
              <div className="h-full flex-1 bg-[#FF9933]"></div>
              <div className="h-full flex-1 bg-white"></div>
              <div className="h-full flex-1 bg-[#138808]"></div>
            </div>
          </div>

          {/* Mobile Header (Hidden on Desktop) */}
          <div className="md:hidden bg-primary p-6 flex flex-col items-center text-center">
            <Emblem className="mb-4 w-[60px] h-[60px]" />
            <h1 className="text-white text-[18px] font-black tracking-tight leading-none">
              Traffic<span className="text-accent">Guard</span>
            </h1>
            <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest mt-0.5">
              Accident Management System
            </p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
            <div className="w-full max-w-[420px]">
              
              <div className="mb-8 text-center md:text-left">
                <h2 className="text-[20px] font-bold text-primary mb-2">Sign In to Portal</h2>
                <div className="flex items-center justify-center md:justify-start gap-1.5 text-danger text-[12px] font-semibold uppercase tracking-wider">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Authorized personnel only
                </div>
              </div>

              {globalError && (
                <div className="mb-6 px-4 py-3 border-l-4 border-danger bg-red-50 text-danger text-sm flex items-center gap-2 font-medium">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {globalError}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <GovInputField
                  id="email" label="Official Email ID" type="email"
                  placeholder="name@traffic.gov.in" value={form.email}
                  onChange={handleChange} error={errors.email} autoComplete="email"
                />
                <GovInputField
                  id="password" label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password" value={form.password}
                  onChange={handleChange} error={errors.password}
                  autoComplete="current-password"
                  rightElement={
                    <button type="button" onClick={() => setShowPassword((v) => !v)}
                      className="text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                      {showPassword ? eyeOff : eyeOpen}
                    </button>
                  }
                />

                <div className="flex items-center justify-between mb-6 -mt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox" name="remember" checked={form.remember}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                    />
                    <span className="text-sm text-gray-600 font-medium">Remember me</span>
                  </label>
                  <button type="button" onClick={() => setShowForgot(true)}
                    className="text-sm text-primary hover:text-primary-dark underline underline-offset-2 transition-colors font-semibold">
                    Forgot Password?
                  </button>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded font-bold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                  {loading && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  )}
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-center text-sm text-gray-600">
                  New official?{' '}
                  <Link to="/register" className="text-primary hover:text-primary-dark font-bold underline underline-offset-2 transition-colors">
                    Register here
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 text-center mt-auto">
            <p className="text-[12px] text-gray-500 mb-1">For technical support contact: support@traffic.gov.in</p>
            <p className="text-[12px] text-gray-400">© 2025 Government of India. All rights reserved.</p>
          </div>
        </div>
      </div>
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </div>
  );
};

export default LoginPage;
