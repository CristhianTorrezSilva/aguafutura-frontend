export default function EmptyState({ message = 'Sin datos', title = 'Sin registros' }) {
  return (
    <div className="empty state-card">
      <span className="state-icon" aria-hidden="true" />
      <strong>{title}</strong>
      <span>{message}</span>
    </div>
  );
}
