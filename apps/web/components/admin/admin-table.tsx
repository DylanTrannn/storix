import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type AdminTableColumn<T> = {
  key: string;
  header: string;
  align?: 'left' | 'right';
  /** Column width as a percentage, e.g. "35%" */
  width?: string;
  headerClassName?: string;
  cellClassName?: string;
  render: (row: T) => ReactNode;
};

interface AdminTableProps<T> {
  columns: AdminTableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  getRowKey: (row: T) => string;
}

const alignClass = {
  left: 'text-left',
  right: 'text-right',
} as const;

export function AdminTable<T>({
  columns,
  data,
  emptyMessage = 'Không có dữ liệu.',
  getRowKey,
}: AdminTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground shadow-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full table-fixed text-sm">
        <colgroup>
          {columns.map((column) => (
            <col key={column.key} style={column.width ? { width: column.width } : undefined} />
          ))}
        </colgroup>
        <thead className="border-b">
          <tr className="hover:bg-transparent">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'h-11 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                  alignClass[column.align ?? 'left'],
                  column.headerClassName,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={getRowKey(row)} className="border-b last:border-0 transition-colors hover:bg-muted/50">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    'px-4 py-3 align-middle',
                    alignClass[column.align ?? 'left'],
                    column.cellClassName,
                  )}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
