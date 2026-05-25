import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { tenantsApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import FormField from '../components/FormField';
import ErrorState from '../components/ErrorState';
import { asArray } from '../utils/format';
import { apiErrorMessage } from '../utils/errors';
import { REGISTER_ROLES } from '../utils/enums';

export default function LoginPage() {
  const { login, register, isAuthenticated } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    tenantId: '',
    fullName: '',
    email: 'admin@aguafutura.ai',
    password: 'Admin123!',
    role: 'ADMIN',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tenantsError, setTenantsError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    tenantsApi
      .list()
      .then((response) => {
        const list = asArray(response.data);
        setTenants(list);
        if (list.length) {
          setForm((current) => ({ ...current, tenantId: current.tenantId || list[0].id }));
        }
      })
      .catch((err) => setTenantsError(apiErrorMessage(err, 'No se pudieron cargar tenants')));
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await login({ tenantId: form.tenantId, email: form.email, password: form.password });
      } else {
        await register(form);
      }
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Login fallido'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>AguaFutura AI</h1>
        <p>Consola segura para operacion hidrica, evidencia e inteligencia operacional.</p>

        <div className="tabs">
          <button className={mode === 'login' ? 'tab active' : 'tab'} type="button" onClick={() => setMode('login')}>
            Login
          </button>
          <button className={mode === 'register' ? 'tab active' : 'tab'} type="button" onClick={() => setMode('register')}>
            Register
          </button>
        </div>

        {tenantsError && <ErrorState message={tenantsError} detail="Puedes ingresar el tenant manualmente mientras el catalogo no este disponible." />}
        {error && <ErrorState message={error} />}

        <div className="form-grid">
          <FormField label="Tenant" help="Se usa solo para login/register; luego el backend resuelve el tenant desde el JWT.">
            {tenants.length ? (
              <select
                value={form.tenantId}
                onChange={(event) => setForm({ ...form, tenantId: event.target.value })}
                required
              >
                <option value="">Seleccionar tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name} ({tenant.code})
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={form.tenantId}
                onChange={(event) => setForm({ ...form, tenantId: event.target.value })}
                placeholder="tenant uuid"
                required
              />
            )}
          </FormField>

          {mode === 'register' && (
            <FormField label="Nombre completo">
              <input
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                required
              />
            </FormField>
          )}

          <FormField label="Correo">
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </FormField>

          <FormField label="Contrasena">
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </FormField>

          {mode === 'register' && (
            <FormField label="Rol">
              <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                {REGISTER_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </FormField>
          )}
        </div>

        <div className="actions">
          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Procesando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </div>
      </form>
    </div>
  );
}
