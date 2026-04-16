import { Navigate } from 'react-router-dom';
import { useAuth } from './useAuth';

/**
 * Usage: <ProtectedRoute roles={['admin', 'manager']}><MonPage /></ProtectedRoute>
 * - Redirige vers /unauthorized si rôle insuffisant
 * - Redirige vers login Keycloak si non authentifié
 */
export default function ProtectedRoute({ roles = [], children }) {
  const { isAuthenticated, hasRole } = useAuth();

  if (!isAuthenticated) {
    // Keycloak login-required s'en charge, mais au cas où
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.some((r) => hasRole(r))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
