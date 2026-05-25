import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>404</h1>
        <p>La pagina solicitada no existe.</p>
        <div className="actions">
          <Link className="button" to="/">Volver al dashboard</Link>
        </div>
      </div>
    </div>
  );
}
