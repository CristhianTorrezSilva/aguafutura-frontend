export function shortId(value, size = 8) {
  if (!value) {
    return '-';
  }

  const text = String(value);
  return text.length > size * 2 ? `${text.slice(0, size)}...${text.slice(-4)}` : text;
}

export function formatShortId(value) {
  return shortId(value);
}
