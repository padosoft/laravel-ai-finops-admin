import type { ReactNode } from 'react';

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  align?: 'right';
  mono?: boolean;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty = 'No rows',
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string | number;
  onRowClick?: (row: T) => void;
  empty?: string;
}) {
  if (rows.length === 0) {
    return (
      <div style={{ padding: '20px 14px', color: 'var(--fg-2)', fontSize: 'var(--text-sm)' }}>{empty}</div>
    );
  }

  return (
    <table className="tbl">
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key} className={c.align === 'right' ? 'num' : undefined}>
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr
            key={rowKey(row, i)}
            className={onRowClick ? 'clickable' : undefined}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            {columns.map((c) => (
              <td key={c.key} className={[c.align === 'right' ? 'num' : '', c.mono ? 'mono' : ''].filter(Boolean).join(' ') || undefined}>
                {c.render ? c.render(row) : String(row[c.key] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
