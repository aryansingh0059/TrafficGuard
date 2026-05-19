import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const UnauthorizedPage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const role = user?.role ?? 'unknown';
  const dashboardPath = role === 'admin' ? '/admin/dashboard' : role === 'public_user' ? '/user/dashboard' : '/login';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 font-sans">
      <div className="gov-card max-w-md w-full text-center py-12 px-8">
        {/* Red Lock Icon */}
        <div className="w-20 h-20 rounded-full bg-danger/10 border-[3px] border-danger flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h1 className="text-[28px] font-bold text-danger mb-2">403 — Access Denied</h1>
        <p className="text-gray-600 text-[14px] mb-4 font-medium">
          You are not authorized to access this page.
        </p>

        {user && (
          <div className="bg-primary/5 border border-primary/20 rounded px-4 py-2 mb-8 inline-block">
            <span className="text-[12px] text-gray-500 font-medium">Your role: </span>
            <span className="text-primary font-bold text-[13px] uppercase tracking-wider">
              {role.replace('_', ' ')}
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(dashboardPath)}
            className="gov-btn-primary px-6 py-2.5 text-[13px]"
          >
            Go to My Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="gov-btn-outline !border-danger !text-danger hover:!bg-danger hover:!text-white px-6 py-2.5 text-[13px]"
          >
            Logout
          </button>
        </div>

        <p className="text-[11px] text-gray-400 mt-8">
          Traffic &amp; Accident Management System — Government of India
        </p>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
