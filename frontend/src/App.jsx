import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import ProtectedRoute, { AdminRoute, UserRoute } from './components/ProtectedRoute';
import useAuthStore from './store/authStore';
import { ToastProvider } from './hooks/useToast';
import AIAssistant from './components/AIAssistant';
import { getProfile } from './services/authService';
import SplashScreen from './components/SplashScreen';

// Auth pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Admin pages
import AdminDashboardPage from './pages/AdminDashboardPage';
import TrafficMapPage from './pages/TrafficMapPage';
import IncidentManagementPage from './pages/IncidentManagementPage';

import UserManagementPage from './pages/UserManagementPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

// Public user pages
import UserDashboardPage from './pages/UserDashboardPage';

// Public (unauthenticated) portal pages
import PublicReportPage from './pages/PublicReportPage';
import PublicTrackPage from './pages/PublicTrackPage';

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user, login, logout } = useAuthStore();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Stop speech synthesis welcome announcement if navigating away from auth/splash pages
  useEffect(() => {
    const isAuthPage = ['/', '/login', '/register'].includes(location.pathname);
    if (!isAuthPage) {
      window.speechSynthesis?.cancel();
    }
  }, [location.pathname]);

  // Determine the correct home redirect based on role
  const roleHome = user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';

  useEffect(() => {
    const sessionToken = sessionStorage.getItem('token') || localStorage.getItem('token');
    
    if (!sessionToken) {
      setCheckingAuth(false);
      return;
    }
    
    // Verify token is still valid with backend
    getProfile()
      .then((res) => {
        // Token valid — update user in store with fresh data
        const userData = res.data?.data?.user;
        const remember = !!localStorage.getItem('token');
        if (userData) {
          login(userData, sessionToken, remember);
        }
        setCheckingAuth(false);
      })
      .catch(() => {
        // Token invalid or expired — clear and redirect
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        logout();
        navigate('/login');
        setCheckingAuth(false);
      });
  }, [login, logout, navigate]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col text-white">
        <svg className="animate-spin h-10 w-10 text-accent mb-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-sm font-semibold tracking-wider uppercase text-slate-400">Verifying session...</p>
      </div>
    );
  }

  return (
    <>
      <a href="#main-content" className="skip-to-content">Skip to main content</a>
      <Routes>

        {/* ── Root redirect ── */}
        <Route path="/"
          element={token ? <Navigate to={roleHome} replace /> : <Navigate to="/login" replace />}
        />

        {/* ── Auth routes ── */}
        <Route path="/login"
          element={token ? <Navigate to={roleHome} replace /> : <LoginPage />}
        />
        <Route path="/register"
          element={token ? <Navigate to={roleHome} replace /> : <RegisterPage />}
        />

        {/* ── Public citizen portal (no login required) ── */}
        <Route path="/report" element={<PublicReportPage />} />
        <Route path="/track"  element={<PublicTrackPage />} />

        {/* ── Unauthorized ── */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* ────────────────────────────────────────────
            ADMIN-ONLY routes
        ──────────────────────────────────────────── */}
        <Route path="/admin/dashboard"
          element={<AdminRoute><AdminDashboardPage /></AdminRoute>}
        />

        {/* Legacy admin-adjacent routes (also require admin role) */}
        <Route path="/dashboard"
          element={<AdminRoute><TrafficMapPage /></AdminRoute>}
        />
        <Route path="/incidents"
          element={<AdminRoute><IncidentManagementPage /></AdminRoute>}
        />
        <Route path="/analytics" element={<Navigate to="/reports" replace />} />
        <Route path="/users"
          element={<AdminRoute><UserManagementPage /></AdminRoute>}
        />
        <Route path="/reports"
          element={<AdminRoute><ReportsPage /></AdminRoute>}
        />
        <Route path="/settings"
          element={<AdminRoute><SettingsPage /></AdminRoute>}
        />

        {/* ────────────────────────────────────────────
            PUBLIC USER-ONLY routes
        ──────────────────────────────────────────── */}
        <Route path="/user/dashboard"
          element={<UserRoute><UserDashboardPage /></UserRoute>}
        />

        {/* ── Catch-all ── */}
        <Route path="*"
          element={token ? <Navigate to={roleHome} replace /> : <Navigate to="/login" replace />}
        />

      </Routes>
      <AIAssistant />
    </>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splashShown');
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem('splashShown', 'true');
    setShowSplash(false);
  };

  return (
    <ToastProvider>
      {showSplash ? (
        <SplashScreen onComplete={handleSplashComplete} />
      ) : (
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      )}
    </ToastProvider>
  );
}

export default App;
