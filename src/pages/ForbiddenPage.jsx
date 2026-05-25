import { Link } from 'react-router-dom';

export default function ForbiddenPage() {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>403</h1>
        <p>No tienes permisos para acceder a este recurso.</p>
        <div className="actions">
          <Link className="button" to="/">Volver al dashboard</Link>
        </div>
      </div>
    </div>
  );
}
