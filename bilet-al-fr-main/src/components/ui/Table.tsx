import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface Column<T> { key: string; header: string; render: (item: T) => ReactNode }

export function Table<T>({ columns, data, rows, className }: {
  columns: Column<T>[] | string[];
  data?: T[];
  rows?: ReactNode[][];
  className?: string;
}) {
  const isSimple = typeof columns[0] === 'string';
  const headers = isSimple ? columns as string[] : (columns as Column<T>[]).map((column) => column.header);
  const bodyRows = isSimple
    ? (rows ?? [])
    : (data ?? []).map((item) => (columns as Column<T>[]).map((column) => column.render(item)));

  return (
    <div className={cn('overflow-x-auto rounded-2xl border border-white/10 theater-scrollbar', className)}>
      <table className="min-w-full divide-y divide-white/10 text-sm">
        <thead className="bg-white/5 text-left text-theater-ivory/70">
          <tr>{headers.map((header) => <th key={header} className="px-4 py-3 font-medium">{header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {bodyRows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-white/[0.035]">
              {row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3 text-white/85">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
