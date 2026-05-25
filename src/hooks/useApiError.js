export function getApiErrorMessage(error, fallback = 'Error inesperado') {
  const data = error?.response?.data;
  const message = data?.message || data?.error || error?.message || fallback;
  const correlationId = data?.correlationId;

  return correlationId ? `${message} (correlationId: ${correlationId})` : message;
}
