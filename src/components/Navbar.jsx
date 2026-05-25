import { useAuth } from '../auth/AuthContext';

export default function Navbar() {
  const { logout, roles } = useAuth();

  return (
    <div className="topbar">
      <span>{roles.join(', ') || 'Sin rol'}</span>
      <button className="button secondary" type="button" onClick={logout}>
        Logout
      </button>
    </div>
  );
}
