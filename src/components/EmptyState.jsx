export default function EmptyState({ message = 'Sin datos' }) {
  return <div className="empty">{message}</div>;
}
