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
    data?.message ||
    data?.detail ||
    data?.error ||
    statusMessages[status] ||
    error?.message ||
    fallback;
  const rawDetails = data?.details || data?.errors || data?.violations;
  const detail = Array.isArray(rawDetails)
    ? rawDetails
      .map((item) => {
        if (typeof item === 'string') return item;
        const text = item.message || item.defaultMessage || item.reason || '';
        return text || item.field ? `${item.field ? `${item.field}: ` : ''}${text}` : String(item);
      })
      .filter(Boolean)
      .join(' | ')
    : rawDetails || data?.detail;

  return {
    status,
    message,
    detail: detail && detail !== message ? detail : '',
    correlationId: data?.correlationId || data?.traceId || data?.requestId || null,
  };
}

export function apiErrorMessage(error, fallback) {
  return normalizeApiError(error, fallback).message;
}
