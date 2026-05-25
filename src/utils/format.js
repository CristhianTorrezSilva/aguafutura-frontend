export function formatDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function valueOrDash(value) {
  return value === null || value === undefined || value === '' ? '-' : String(value);
}

export function asArray(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : value.content || value.items || [];
}
