import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Đang tải...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly) {
    const role = user?.scope || user?.role || '';
    if (!role.includes('ADMIN')) return <Navigate to="/attendance" replace />;
  }
  return children;
}
