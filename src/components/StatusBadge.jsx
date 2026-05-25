export default function StatusBadge({ value }) {
  const text = value || '-';
  const normalized = String(text).toUpperCase();
  let variant = '';

  if (['ENABLED', 'OPEN', 'COMPLETED', 'LOW', 'TRUE'].includes(normalized)) {
    variant = 'success';
  } else if (['HIGH', 'CRITICAL', 'FAILED', 'DISABLED', 'FALSE'].includes(normalized)) {
    variant = 'danger';
  } else if (['MEDIUM', 'IN_PROGRESS', 'PENDING'].includes(normalized)) {
    variant = 'warning';
  }

  return <span className={`badge ${variant}`}>{text}</span>;
}
