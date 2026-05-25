export function normalizeApiError(error, fallback = 'No se pudo completar la operacion') {
  const data = error?.response?.data;
  const status = error?.response?.status;
  const statusMessages = {
    400: fallback || 'Revisa los datos ingresados.',
    403: 'No tienes permisos para realizar esta accion.',
    404: 'No se encontro el recurso seleccionado.',
    409: 'Ya existe un registro con ese codigo.',
    500: 'Ocurrio un error inesperado.',
  };

  if (typeof data === 'string') {
    return { status, message: statusMessages[status] || data, detail: statusMessages[status] ? data : '', correlationId: null };
  }

  const message =
    statusMessages[status] ||
    data?.message ||
    data?.detail ||
    data?.error ||
    error?.message ||
    fallback;

  return {
    status,
    message,
    detail: data?.detail && data.detail !== message ? data.detail : '',
    correlationId: data?.correlationId || data?.traceId || data?.requestId || null,
  };
}

export function apiErrorMessage(error, fallback) {
  return normalizeApiError(error, fallback).message;
}
