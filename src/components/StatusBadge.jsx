export default function StatusBadge({ value }) {
  const text = value || '-';
  const normalized = String(text).toUpperCase();
  let variant = '';

  if (['ENABLED', 'OPEN', 'COMPLETED', 'LOW', 'TRUE', 'IA ACTIVA', 'ACTIVA'].includes(normalized)) {
    variant = 'success';
  } else if (['HIGH', 'FAILED'].includes(normalized)) {
    variant = 'danger';
  } else if (['CRITICAL'].includes(normalized)) {
    variant = 'critical';
  } else if (['MEDIUM', 'IN_PROGRESS', 'PENDING', 'FALLBACK DETERMINISTICO', 'DISABLED', 'FALSE', 'INACTIVA'].includes(normalized)) {
    variant = 'warning';
  }

  return <span className={`badge ${variant}`}>{text}</span>;
}
