import { valueOrDash } from '../utils/format';

export default function DataTable({ columns, rows, emptyMessage = 'Sin datos' }) {
  if (!rows?.length) {
    return <div className="empty">{emptyMessage}</div>;
  }

  return (
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
          {rows.map((row, index) => (
            <tr key={row.id || `${index}`}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render ? column.render(row) : valueOrDash(row[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
