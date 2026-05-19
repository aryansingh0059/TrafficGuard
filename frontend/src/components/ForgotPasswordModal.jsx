import { useState } from 'react';
import { forgotPassword } from '../services/authService';
import { extractMessage } from '../utils/errorHelpers';

const ForgotPasswordModal = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email address.'); return; }
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(extractMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal card — stop click propagation so backdrop click works */}
      <div
        className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-8 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center">
            <svg className="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
        </div>

        {success ? (
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">Check your inbox</h3>
            <p className="text-slate-400 text-sm mb-6">
              If <span className="text-orange-400 font-medium">{email}</span> is registered,
              you'll receive a password reset link shortly.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-colors"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold text-white mb-1 text-center">Forgot Password?</h3>
            <p className="text-slate-400 text-sm text-center mb-6">
              Enter your email and we'll send you a reset link.
            </p>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-4 py-2.5 rounded-lg text-sm text-white bg-slate-800 border border-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50 outline-none transition-all placeholder:text-slate-500 mb-5"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                )}
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
