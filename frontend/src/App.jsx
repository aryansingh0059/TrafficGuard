import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute, { AdminRoute, UserRoute } from './components/ProtectedRoute';
import useAuthStore from './store/authStore';
import { ToastProvider } from './hooks/useToast';
import AIAssistant from './components/AIAssistant';

// Auth pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Admin pages
import AdminDashboardPage from './pages/AdminDashboardPage';
import TrafficMapPage from './pages/TrafficMapPage';
import IncidentManagementPage from './pages/IncidentManagementPage';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

// Public user pages
import UserDashboardPage from './pages/UserDashboardPage';

// Public (unauthenticated) portal pages
import PublicReportPage from './pages/PublicReportPage';
import PublicTrackPage from './pages/PublicTrackPage';

function App() {
  const { token, user } = useAuthStore();

  // Determine the correct home redirect based on role
  const roleHome = user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';

  return (
    <ToastProvider>
      <BrowserRouter>
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
          <Route path="/analytics"
            element={<AdminRoute><AnalyticsDashboardPage /></AdminRoute>}
          />
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
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
