export default function LoadingState({ message = 'Cargando...' }) {
  return (
    <div className="loading state-card">
      <span className="loading-dot" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
