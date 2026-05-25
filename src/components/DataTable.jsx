import { useMemo, useState } from 'react';
import { valueOrDash } from '../utils/format';
import { formatShortId } from '../utils/ids';
import EmptyState from './EmptyState';

function CellValue({ value, mono }) {
  const text = valueOrDash(value);

  if (text !== '-' && String(text).length > 22) {
    return (
      <span className={mono ? 'mono truncate' : 'truncate'} title={String(text)}>
        {mono ? formatShortId(text) : text}
      </span>
    );
  }

  return <span className={mono ? 'mono' : undefined}>{text}</span>;
}

export default function DataTable({ columns, rows, emptyTitle = 'Sin registros', emptyMessage = 'Sin datos', searchable = true, searchPlaceholder = 'Buscar en la tabla...' }) {
  const [query, setQuery] = useState('');
  const visibleRows = useMemo(() => {
    const list = rows || [];
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return list;
    }

    return list.filter((row) =>
      columns.some((column) => {
        if (column.searchable === false) return false;
        const value = column.searchValue ? column.searchValue(row) : row[column.key];
        return String(value ?? '').toLowerCase().includes(normalized);
      })
    );
  }, [columns, query, rows]);

  if (!rows?.length) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div className="data-table-wrap">
      {searchable && (
        <div className="table-toolbar">
          <div className="table-search">
            <span aria-hidden="true">/</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              type="search"
            />
          </div>
          <span className="table-count">{visibleRows.length} de {rows.length}</span>
        </div>
      )}
      {!visibleRows.length ? (
        <EmptyState title="Sin coincidencias" message="Ajusta la busqueda para ver mas resultados." />
      ) : (
        <div className="table-panel">
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, index) => (
                <tr key={row.id || `${index}`}>
                  {columns.map((column) => (
                    <td key={column.key}>
                      {column.render ? column.render(row) : <CellValue value={row[column.key]} mono={column.mono} />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
