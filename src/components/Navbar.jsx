import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import ShortId from './ShortId';
import { tenantLabel } from '../utils/display';

const routeTitles = [
  { test: (path) => path === '/', title: 'Centro operativo', subtitle: 'Monitoreo de infraestructura hidrica' },
  { test: (path) => path.startsWith('/zones'), title: 'Zonas operativas', subtitle: 'Segmentacion territorial y operativa' },
  { test: (path) => path.startsWith('/assets/'), title: 'Detalle de activo', subtitle: 'Consumos, evidencia e IA' },
  { test: (path) => path.startsWith('/assets'), title: 'Activos hidricos', subtitle: 'Infraestructura critica y telemetria' },
  { test: (path) => path.startsWith('/incidents'), title: 'Incidencias', subtitle: 'Riesgos, severidad y trazabilidad' },
  { test: (path) => path.startsWith('/work-orders'), title: 'Ordenes de trabajo', subtitle: 'Ejecucion operativa y evidencia' },
  { test: (path) => path.startsWith('/evidence'), title: 'Evidencia', subtitle: 'Archivos asociados a entidades operativas' },
  { test: (path) => path.startsWith('/ai-suggestions'), title: 'Asistente IA', subtitle: 'Sugerencias operativas y analisis' },
  { test: (path) => path.startsWith('/profile'), title: 'Perfil', subtitle: 'Sesion y permisos activos' },
];

export default function Navbar() {
  const { logout, roles, tenantId, tenantName, tenantShortId, userId } = useAuth();
  const location = useLocation();
  const current = useMemo(
    () => routeTitles.find((item) => item.test(location.pathname)) || { title: 'AguaFutura AI', subtitle: 'Operacion hidrica' },
    [location.pathname]
  );
  const tenant = tenantLabel({ tenantName, tenantShortId, tenantId });

  return (
    <div className="topbar">
      <div className="topbar-title">
        <strong>{current.title}</strong>
        <span>{current.subtitle}</span>
      </div>
      <div className="topbar-actions">
        <span className="session-pill">{roles.join(', ') || 'Sin rol'}</span>
        <span className="session-pill" title={tenantId || undefined}>Tenant {tenant}</span>
        <span className="session-pill">Usuario <ShortId value={userId} /></span>
        <button className="button secondary" type="button" onClick={logout}>
          Salir
        </button>
      </div>
    </div>
  );
}
