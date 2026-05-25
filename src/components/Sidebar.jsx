import { NavLink } from 'react-router-dom';
import { PERMISSIONS } from '../auth/permissions';
import { useAuth } from '../auth/AuthContext';
import { useRoles } from '../hooks/useRoles';
import { tenantLabel } from '../utils/display';

const navItems = [
  { to: '/dashboard', label: 'Centro operativo', roles: PERMISSIONS.dashboardRead },
  { to: '/zones', label: 'Zonas', roles: PERMISSIONS.zonesRead },
  { to: '/assets', label: 'Activos hidricos', roles: PERMISSIONS.assetsRead },
  { to: '/incidents', label: 'Incidencias', roles: PERMISSIONS.incidentsRead },
  { to: '/work-orders', label: 'Ordenes de trabajo', roles: PERMISSIONS.workOrdersRead },
  { to: '/evidence', label: 'Evidencia', roles: PERMISSIONS.evidenceRead },
  { to: '/ai-suggestions', label: 'Asistente IA', roles: PERMISSIONS.aiUse },
  { to: '/profile', label: 'Perfil' },
];

export default function Sidebar() {
  const { roles, tenantId, tenantName, tenantShortId } = useAuth();
  const { can } = useRoles();
  const tenant = tenantLabel({ tenantName, tenantShortId, tenantId });

  return (
    <aside className="sidebar">
      <div className="brand">
        <strong>AguaFutura AI</strong>
        <span>Operacion hidrica multi-tenant</span>
      </div>

      <nav className="nav-list">
        {navItems.filter((item) => can(item.roles)).map((item) => (
          <NavLink key={item.to} to={item.to} className="nav-link" end={item.to === '/'}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span title={tenantId || undefined}>Tenant: {tenant}</span>
        <span>Roles: {roles.join(', ') || '-'}</span>
      </div>
    </aside>
  );
}
