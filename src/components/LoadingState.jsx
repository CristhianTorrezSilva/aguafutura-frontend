export default function LoadingState({ message = 'Cargando...' }) {
  return <div className="loading">{message}</div>;
}
