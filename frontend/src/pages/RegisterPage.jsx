import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { registerUser } from '../services/authService';
import { extractErrors, extractMessage } from '../utils/errorHelpers';
import GovInputField from '../components/GovInputField';

const TopBanner = () => (
  <div className="w-full bg-danger text-white text-xs py-2 px-4 flex items-center justify-center gap-2 font-medium z-50 relative">
    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
    <span>This is an authorized government system. Unauthorized access is strictly prohibited.</span>
  </div>
);

const Emblem = ({ className = "" }) => (
  <div className={`w-[80px] h-[80px] rounded-full border-[3px] border-accent flex items-center justify-center bg-white/5 ${className}`}>
    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2L3 6v6.5c0 5.05 3.81 9.85 9 11.5 5.19-1.65 9-6.45 9-11.5V6l-9-4zm0 2.18l7 3.12v5.2c0 4.08-2.82 8.01-7 9.51-4.18-1.5-7-5.43-7-9.51V7.3l7-3.12z" />
    </svg>
  </div>
);

const LeftPanel = () => (
  <div className="hidden md:flex flex-col items-center justify-center w-[45%] bg-primary p-10 relative overflow-hidden text-center shrink-0">
    <Emblem className="mb-6" />
    <h1 className="text-white text-[20px] font-bold uppercase tracking-wide leading-snug max-w-[80%] mb-1">
      Traffic &amp; Accident Management System
    </h1>
    <h2 className="text-accent text-[13px] font-bold uppercase tracking-widest mb-10">
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

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  // Role selection
  const [role, setRole] = useState('public_user');

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', password_confirmation: '', admin_key: '',
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAdminKey, setShowAdminKey] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setGlobalError('');

    // Frontend validation for admin key
    if (role === 'admin' && !form.admin_key.trim()) {
      setErrors({ admin_key: 'Admin Secret Key is required for admin registration.' });
      setLoading(false);
      return;
    }

    try {
      const payload = { ...form, role };
      if (role !== 'admin') delete payload.admin_key;

      const { data } = await registerUser(payload);
      const userData = data.data.user;
      const token = data.data.token;

      login(userData, token);

      // Role-based redirect
      const userRole = userData.role ?? userData.roles?.[0]?.name ?? role;
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

  const EyeOpen = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
  const EyeOff = () => (
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
          {/* Top Bar */}
          <div className="w-full">
            <div className="bg-primary px-6 py-2 flex items-center justify-between">
              <span className="text-white text-[11px] uppercase tracking-widest font-semibold">Government of India</span>
              <div className="md:hidden flex items-center gap-2">
                <span className="text-accent text-[11px] font-bold uppercase tracking-widest">Ministry of Road Transport</span>
              </div>
            </div>
            <div className="h-[3px] w-full flex">
              <div className="h-full flex-1 bg-[#FF9933]"></div>
              <div className="h-full flex-1 bg-white"></div>
              <div className="h-full flex-1 bg-[#138808]"></div>
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden bg-primary p-6 flex flex-col items-center text-center shrink-0">
            <Emblem className="mb-4 w-[60px] h-[60px]" />
            <h1 className="text-white text-[16px] font-bold uppercase tracking-wide leading-snug">
              Traffic &amp; Accident Management System
            </h1>
          </div>

          <div className="flex-1 flex flex-col items-center justify-start p-6 sm:p-10 overflow-y-auto">
            <div className="w-full max-w-[440px] pb-8">

              <div className="mb-6 text-center md:text-left">
                <h2 className="text-[20px] font-bold text-primary mb-1">Create Account</h2>
                <p className="text-[13px] text-gray-500 font-medium">Select your account type to get started.</p>
              </div>

              {/* ── Role Toggle ── */}
              <div className="mb-6">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Account Type</p>
                <div className="grid grid-cols-2 gap-3">
                  {/* Admin Tab */}
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 font-bold text-[13px] ${
                      role === 'admin'
                        ? 'bg-primary border-primary text-white shadow-md'
                        : 'bg-white border-border text-gray-500 hover:border-primary/40 hover:text-primary'
                    }`}
                  >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Register as Admin
                    {role === 'admin' && (
                      <span className="text-[9px] uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded font-black">Selected</span>
                    )}
                  </button>

                  {/* Public User Tab */}
                  <button
                    type="button"
                    onClick={() => setRole('public_user')}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 font-bold text-[13px] ${
                      role === 'public_user'
                        ? 'bg-primary border-primary text-white shadow-md'
                        : 'bg-white border-border text-gray-500 hover:border-primary/40 hover:text-primary'
                    }`}
                  >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Register as Public User
                    {role === 'public_user' && (
                      <span className="text-[9px] uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded font-black">Selected</span>
                    )}
                  </button>
                </div>

                {/* Role description */}
                <p className="text-[11px] text-gray-500 mt-2 font-medium text-center">
                  {role === 'admin'
                    ? '🛡️ Admin accounts have full access to all incidents, analytics, and user management.'
                    : '👤 Public users can report incidents and track their own reports.'}
                </p>
              </div>

              {globalError && (
                <div className="mb-5 px-4 py-3 border-l-4 border-danger bg-red-50 text-danger text-[13px] flex items-center gap-2 font-medium" role="alert">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {globalError}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <GovInputField
                  id="name" label="Full Name" type="text"
                  placeholder="e.g. Ramesh Kumar" value={form.name}
                  onChange={handleChange} error={errors.name} autoComplete="name"
                />
                <GovInputField
                  id="email" label="Email Address" type="email"
                  placeholder="name@example.com" value={form.email}
                  onChange={handleChange} error={errors.email} autoComplete="email"
                />
                <GovInputField
                  id="phone" label="Contact Number" type="tel"
                  placeholder="10-digit mobile number" value={form.phone}
                  onChange={handleChange} error={errors.phone} autoComplete="tel"
                />
                <GovInputField
                  id="password" label="Create Password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Minimum 8 characters" value={form.password}
                  onChange={handleChange} error={errors.password}
                  autoComplete="new-password"
                  rightElement={
                    <button type="button" onClick={() => setShowPass((v) => !v)}
                      className="text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                      {showPass ? <EyeOff /> : <EyeOpen />}
                    </button>
                  }
                />
                <GovInputField
                  id="password_confirmation" label="Confirm Password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter password" value={form.password_confirmation}
                  onChange={handleChange} error={errors.password_confirmation}
                  autoComplete="new-password"
                  rightElement={
                    <button type="button" onClick={() => setShowConfirm((v) => !v)}
                      className="text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                      {showConfirm ? <EyeOff /> : <EyeOpen />}
                    </button>
                  }
                />

                {/* Admin Secret Key — only shown when Admin role is selected */}
                {role === 'admin' && (
                  <div className="mt-1 mb-1 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-[11px] text-amber-700 font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      Admin Authentication Required
                    </p>
                    <GovInputField
                      id="admin_key" label="Admin Secret Key"
                      type={showAdminKey ? 'text' : 'password'}
                      placeholder="Enter the administrator secret key"
                      value={form.admin_key}
                      onChange={handleChange}
                      error={errors.admin_key}
                      rightElement={
                        <button type="button" onClick={() => setShowAdminKey((v) => !v)}
                          className="text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                          {showAdminKey ? <EyeOff /> : <EyeOpen />}
                        </button>
                      }
                    />
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-3 mt-5 gov-btn-primary flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-[14px]">
                  {loading && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  )}
                  {loading ? 'Processing...' : (role === 'admin' ? 'Register Admin Account' : 'Register as Public User')}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-center text-[13px] text-gray-600">
                  Already registered?{' '}
                  <Link to="/login" className="text-primary hover:text-primary-dark font-bold underline underline-offset-2 transition-colors">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 text-center mt-auto shrink-0 bg-white border-t border-border">
            <p className="text-[12px] text-gray-500 mb-1">For technical support contact: support@traffic.gov.in</p>
            <p className="text-[12px] text-gray-400">© 2025 Government of India. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
