import { useAuth } from '../auth/AuthContext';
import { hasAnyRole } from '../auth/permissions';

export function useRoles() {
  const { roles } = useAuth();

  return {
    roles,
    can: (allowedRoles) => hasAnyRole(roles, allowedRoles),
  };
}
