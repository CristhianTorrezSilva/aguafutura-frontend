import { useEffect, useState } from 'react';
import { authApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import PageHeader from '../components/PageHeader';
import { valueOrDash } from '../utils/format';

export default function ProfilePage() {
  const auth = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    authApi
      .me()
      .then((response) => setProfile(response.data))
      .catch((err) => setError(err.response?.data?.message || err.message || 'No se pudo cargar perfil'));
  }, []);

  return (
    <div className="page">
      <PageHeader title="Perfil" description="Datos de sesion y respuesta de /api/v1/auth/me." />
      {error && <div className="error">{error}</div>}
      <div className="panel">
        <dl className="detail-list">
          <div><dt>userId</dt><dd>{valueOrDash(profile?.userId || profile?.id || auth.userId)}</dd></div>
          <div><dt>tenantId</dt><dd>{valueOrDash(profile?.tenantId || auth.tenantId)}</dd></div>
          <div><dt>roles</dt><dd>{valueOrDash((profile?.roles || auth.roles || []).join(', '))}</dd></div>
          <div><dt>tokenType</dt><dd>{valueOrDash(auth.tokenType)}</dd></div>
        </dl>
      </div>
    </div>
  );
}
