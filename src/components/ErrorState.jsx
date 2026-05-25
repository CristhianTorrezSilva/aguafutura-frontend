export default function ErrorState({ message = 'Error inesperado', detail, correlationId }) {
  return (
    <div className="error state-card">
      <strong>{message}</strong>
      {detail && <span>{detail}</span>}
      {correlationId && <small>ID de seguimiento: {correlationId}</small>}
    </div>
  );
}
