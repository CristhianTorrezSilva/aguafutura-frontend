import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { tenantsApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import FormField from '../components/FormField';
import { asArray } from '../utils/format';
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
      .catch((err) => setError(err.response?.data?.message || err.message || 'No se pudieron cargar tenants'));
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
      setError(err.response?.data?.message || err.message || 'Login fallido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>AguaFutura AI</h1>
        <p>Ingresa con un tenant y credenciales validas.</p>

        <div className="tabs">
          <button className={mode === 'login' ? 'tab active' : 'tab'} type="button" onClick={() => setMode('login')}>
            Login
          </button>
          <button className={mode === 'register' ? 'tab active' : 'tab'} type="button" onClick={() => setMode('register')}>
            Register
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="form-grid">
          <FormField label="Tenant">
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
          </FormField>

          {mode === 'register' && (
            <FormField label="Full name">
              <input
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                required
              />
            </FormField>
          )}

          <FormField label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </FormField>

          <FormField label="Password">
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </FormField>

          {mode === 'register' && (
            <FormField label="Role">
              <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                {REGISTER_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </FormField>
          )}
        </div>

        <div className="actions">
          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Procesando...' : mode === 'login' ? 'Ingresar' : 'Registrar'}
          </button>
        </div>
      </form>
    </div>
  );
}
