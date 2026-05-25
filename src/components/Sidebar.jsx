import { NavLink } from 'react-router-dom';
import { PERMISSIONS } from '../auth/permissions';
import { useAuth } from '../auth/AuthContext';
import { useRoles } from '../hooks/useRoles';

const navItems = [
  { to: '/', label: 'Dashboard', roles: PERMISSIONS.dashboardRead },
  { to: '/zones', label: 'Zonas', roles: PERMISSIONS.zonesRead },
  { to: '/assets', label: 'Activos', roles: PERMISSIONS.assetsRead },
  { to: '/incidents', label: 'Incidentes', roles: PERMISSIONS.incidentsRead },
  { to: '/work-orders', label: 'Ordenes', roles: PERMISSIONS.workOrdersRead },
  { to: '/evidence', label: 'Evidencia', roles: PERMISSIONS.evidenceRead },
  { to: '/ai-suggestions', label: 'AI Suggestions', roles: PERMISSIONS.aiUse },
  { to: '/profile', label: 'Perfil' },
];

export default function Sidebar() {
  const { roles, tenantId } = useAuth();
  const { can } = useRoles();

  return (
    <aside className="sidebar">
      <div className="brand">
        <strong>AguaFutura AI</strong>
        <span>Operacion hidrica</span>
      </div>

      <nav className="nav-list">
        {navItems.filter((item) => can(item.roles)).map((item) => (
          <NavLink key={item.to} to={item.to} className="nav-link" end={item.to === '/'}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span>Tenant: {tenantId || '-'}</span>
        <span>Roles: {roles.join(', ') || '-'}</span>
      </div>
    </aside>
  );
}
