import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

/** Requires a valid token AND role === 'admin' */
export const AdminRoute = ({ children }) => {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/unauthorized" replace />;
  return children;
};

/** Requires a valid token AND role === 'public_user' */
export const UserRoute = ({ children }) => {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'public_user') return <Navigate to="/unauthorized" replace />;
  return children;
};

/** Generic: just requires a valid token */
const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;
