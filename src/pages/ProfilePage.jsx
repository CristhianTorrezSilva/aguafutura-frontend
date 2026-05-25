import { useEffect, useState } from 'react';
import { authApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import ErrorState from '../components/ErrorState';
import PageHeader from '../components/PageHeader';
import ShortId from '../components/ShortId';
import { apiErrorMessage } from '../utils/errors';
import { tenantLabel } from '../utils/display';
import { valueOrDash } from '../utils/format';

export default function ProfilePage() {
  const auth = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    authApi
      .me()
      .then((response) => setProfile(response.data))
      .catch((err) => setError(apiErrorMessage(err, 'No se pudo cargar perfil')));
  }, []);

  return (
    <div className="page">
      <PageHeader eyebrow="Sesion" title="Perfil" description="Datos activos de sesion, tenant y permisos recibidos desde /api/v1/auth/me." />
      {error && <ErrorState message={error} />}
      <div className="panel">
        <dl className="detail-list">
          <div><dt>Usuario</dt><dd><ShortId value={profile?.userId || profile?.id || auth.userId} copyable /></dd></div>
          <div><dt>Tenant</dt><dd>{tenantLabel({
            tenantName: profile?.tenantName || profile?.tenant?.name || auth.tenantName,
            tenantShortId: profile?.tenantShortId || profile?.tenant?.shortId || auth.tenantShortId,
            tenantId: profile?.tenantId || auth.tenantId,
          })}</dd></div>
          <div><dt>roles</dt><dd>{valueOrDash((profile?.roles || auth.roles || []).join(', '))}</dd></div>
          <div><dt>tokenType</dt><dd>{valueOrDash(auth.tokenType)}</dd></div>
        </dl>
      </div>
    </div>
  );
}
