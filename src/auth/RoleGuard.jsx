import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { hasAnyRole } from './permissions';

export default function RoleGuard({ allowedRoles, children }) {
  const { roles } = useAuth();

  if (!allowedRoles?.length) {
    return children;
  }

  const allowed = hasAnyRole(roles, allowedRoles);

  if (!allowed) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}
