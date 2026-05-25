import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/services';
import { normalizeRoles } from '../utils/auth';

const AuthContext = createContext(null);

const readStoredAuth = () => ({
  accessToken: localStorage.getItem('accessToken'),
  tokenType: localStorage.getItem('tokenType') || 'Bearer',
  userId: localStorage.getItem('userId'),
  tenantId: localStorage.getItem('tenantId'),
  tenantName: localStorage.getItem('tenantName'),
  tenantShortId: localStorage.getItem('tenantShortId'),
  roles: normalizeRoles(localStorage.getItem('roles')),
});

function persistAuth({ accessToken, tokenType, userId, tenantId, tenantName, tenantShortId, roles }) {
  localStorage.setItem('accessToken', String(accessToken || '').replace(/^Bearer\s+/i, ''));
  localStorage.setItem('tokenType', 'Bearer');
  localStorage.setItem('userId', userId || '');
  localStorage.setItem('tenantId', tenantId || '');
  localStorage.setItem('tenantName', tenantName || '');
  localStorage.setItem('tenantShortId', tenantShortId || '');
  localStorage.setItem('roles', JSON.stringify(normalizeRoles(roles)));
}

function clearAuthStorage() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('tokenType');
  localStorage.removeItem('userId');
  localStorage.removeItem('tenantId');
  localStorage.removeItem('tenantName');
  localStorage.removeItem('tenantShortId');
  localStorage.removeItem('roles');
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('accessToken')));
  const navigate = useNavigate();

  const logout = useCallback(() => {
    clearAuthStorage();
    setAuth({ accessToken: null, tokenType: 'Bearer', userId: null, tenantId: null, tenantName: null, tenantShortId: null, roles: [] });
    navigate('/login', { replace: true });
  }, [navigate]);

  const loadProfile = useCallback(async () => {
    const response = await authApi.me();
    const profile = response.data || {};
    const nextAuth = {
      accessToken: localStorage.getItem('accessToken'),
      tokenType: localStorage.getItem('tokenType') || 'Bearer',
      userId: profile.userId || profile.id || localStorage.getItem('userId'),
      tenantId: profile.tenantId || localStorage.getItem('tenantId'),
      tenantName: profile.tenantName || profile.tenant?.name || localStorage.getItem('tenantName'),
      tenantShortId: profile.tenantShortId || profile.tenant?.shortId || localStorage.getItem('tenantShortId'),
      roles: normalizeRoles(profile.roles || localStorage.getItem('roles')),
    };

    persistAuth(nextAuth);
    setAuth(nextAuth);
    return profile;
  }, []);

  const login = useCallback(
    async ({ tenantId, email, password }) => {
      const response = await authApi.login({ tenantId, email, password });
      const data = response.data || {};
      const token = data.accessToken || data.token;
      const tokenType = data.tokenType || 'Bearer';

      if (!token) {
        throw new Error('El backend no devolvio accessToken');
      }

      persistAuth({
        accessToken: token,
        tokenType,
        userId: data.userId,
        tenantId: data.tenantId || tenantId,
        tenantName: data.tenantName || data.tenant?.name,
        tenantShortId: data.tenantShortId || data.tenant?.shortId,
        roles: normalizeRoles(data.roles),
      });

      setAuth(readStoredAuth());
      return loadProfile();
    },
    [loadProfile]
  );

  const register = useCallback(
    async ({ tenantId, fullName, email, password, role }) => {
      const response = await authApi.register({ tenantId, fullName, email, password, role });
      const data = response.data || {};
      const token = data.accessToken || data.token;
      const tokenType = data.tokenType || 'Bearer';

      if (!token) {
        throw new Error('El backend no devolvio accessToken');
      }

      persistAuth({
        accessToken: token,
        tokenType,
        userId: data.userId,
        tenantId: data.tenantId || tenantId,
        tenantName: data.tenantName || data.tenant?.name,
        tenantShortId: data.tenantShortId || data.tenant?.shortId,
        roles: normalizeRoles(data.roles),
      });

      setAuth(readStoredAuth());
      return loadProfile();
    },
    [loadProfile]
  );

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      if (!localStorage.getItem('accessToken')) {
        setLoading(false);
        return;
      }

      try {
        await loadProfile();
      } catch {
        clearAuthStorage();
        if (active) {
          setAuth({ accessToken: null, tokenType: 'Bearer', userId: null, tenantId: null, tenantName: null, tenantShortId: null, roles: [] });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    bootstrap();
    return () => {
      active = false;
    };
  }, [loadProfile]);

  useEffect(() => {
    const onUnauthorized = () => logout();
    const onForbidden = () => navigate('/forbidden', { replace: true });

    window.addEventListener('auth:unauthorized', onUnauthorized);
    window.addEventListener('auth:forbidden', onForbidden);
    return () => {
      window.removeEventListener('auth:unauthorized', onUnauthorized);
      window.removeEventListener('auth:forbidden', onForbidden);
    };
  }, [logout, navigate]);

  const value = useMemo(
    () => ({
      ...auth,
      isAuthenticated: Boolean(auth.accessToken),
      loading,
      login,
      register,
      logout,
      refreshProfile: loadProfile,
    }),
    [auth, loading, login, register, logout, loadProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
