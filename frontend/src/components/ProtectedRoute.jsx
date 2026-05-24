import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const getFallbackToken = () => sessionStorage.getItem('token') || localStorage.getItem('token');
const getFallbackRole = () => {
  try {
    const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (userStr) {
      const parsed = JSON.parse(userStr);
      return parsed?.role ?? null;
    }
  } catch (e) {}
  return null;
};

/** Requires a valid token AND role === 'admin' */
export const AdminRoute = ({ children }) => {
  const { token, role } = useAuthStore();
  const activeToken = token || getFallbackToken();
  const activeRole = role || getFallbackRole();

  if (!activeToken) return <Navigate to="/login" replace />;
  if (activeRole !== 'admin') return <Navigate to="/unauthorized" replace />;
  return children;
};

/** Requires a valid token AND role === 'public_user' */
export const UserRoute = ({ children }) => {
  const { token, role } = useAuthStore();
  const activeToken = token || getFallbackToken();
  const activeRole = role || getFallbackRole();

  if (!activeToken) return <Navigate to="/login" replace />;
  if (activeRole !== 'public_user') return <Navigate to="/unauthorized" replace />;
  return children;
};

/** Generic: just requires a valid token */
const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore();
  const activeToken = token || getFallbackToken();

  if (!activeToken) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;
