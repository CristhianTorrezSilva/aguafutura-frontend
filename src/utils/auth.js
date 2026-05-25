export function normalizeRoles(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map(normalizeRole).filter(Boolean);
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(normalizeRole).filter(Boolean) : [normalizeRole(parsed)].filter(Boolean);
  } catch {
    return String(value)
      .split(',')
      .map(normalizeRole)
      .filter(Boolean);
  }
}

export function normalizeRole(role) {
  return String(role || '').trim().replace(/^ROLE_/, '').toUpperCase();
}
