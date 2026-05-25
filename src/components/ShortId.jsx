import { useState } from 'react';
import { formatShortId } from '../utils/ids';

export default function ShortId({ value, copyable = false }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!value || !navigator.clipboard) return;
    await navigator.clipboard.writeText(String(value));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  if (!value) {
    return <span>-</span>;
  }

  return (
    <span className="short-id">
      <span className="mono" title={String(value)}>{formatShortId(value)}</span>
      {copyable && (
        <button className="icon-button" type="button" onClick={copy} title="Copiar ID">
          {copied ? 'OK' : 'Copiar'}
        </button>
      )}
    </span>
  );
}
