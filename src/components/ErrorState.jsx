export default function ErrorState({ message = 'Error inesperado' }) {
  return <div className="error">{message}</div>;
}
