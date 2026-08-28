import type { ReactNode } from 'react';

import { Repeat, Show } from 'meemaw';

import { cn } from '@shared/utils/cn';

export interface Column<T> {
  readonly key: string;
  readonly header: string;
  readonly render: (row: T) => ReactNode;
  /** Numbers read better right-aligned and tabular. */
  readonly numeric?: boolean;
}

/**
 * The console's one table.
 *
 * Every list screen uses it, so sorting out row density, empty state and the
 * loading shape once fixes them everywhere.
 */
export function DataTable<T>({
  rows,
  columns,
  isLoading,
  empty,
  onRowClick,
  rowKey,
}: {
  readonly rows: readonly T[];
  readonly columns: readonly Column<T>[];
  readonly isLoading: boolean;
  readonly empty: string;
  readonly onRowClick?: (row: T) => void;
  readonly rowKey: (row: T) => string;
}) {
  return (
    <div className="overflow-x-auto rounded-blade border border-line bg-white">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-line">
            <Repeat each={[...columns]}>
              {(column: Column<T>) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-3 py-2.5 font-mono text-xs uppercase tracking-overline text-ink-3',
                    column.numeric ? 'text-right' : 'text-left',
                  )}
                >
                  {column.header}
                </th>
              )}
            </Repeat>
          </tr>
        </thead>

        <tbody>
          {/* Skeleton ROWS, not a spinner — the table keeps its shape. */}
          <Show when={isLoading}>
            <Repeat each={[0, 1, 2, 3, 4, 5]}>
              {(index: number) => (
                <tr key={index} className="border-b border-line/60">
                  <Repeat each={[...columns]}>
                    {(column: Column<T>) => (
                      <td key={column.key} className="px-3 py-2.5">
                        <span
                          aria-hidden="true"
                          className="block h-3 w-full animate-shimmer rounded-full bg-skeleton"
                        />
                      </td>
                    )}
                  </Repeat>
                </tr>
              )}
            </Repeat>
          </Show>

          <Show when={!isLoading && rows.length === 0}>
            <tr>
              <td colSpan={columns.length} className="px-3 py-12 text-center text-sm text-ink-3">
                {empty}
              </td>
            </tr>
          </Show>

          <Show when={!isLoading}>
            <Repeat each={[...rows]}>
              {(row: T) => (
                <tr
                  key={rowKey(row)}
                  {...(onRowClick !== undefined && {
                    onClick: () => {
                      onRowClick(row);
                    },
                    tabIndex: 0,
                    onKeyDown: (event: React.KeyboardEvent) => {
                      if (event.key === 'Enter') onRowClick(row);
                    },
                  })}
                  className={cn(
                    'border-b border-line/60',
                    onRowClick !== undefined &&
                      'cursor-pointer transition-colors hover:bg-sky-soft focus-visible:bg-sky-soft focus-visible:outline-none',
                  )}
                >
                  <Repeat each={[...columns]}>
                    {(column: Column<T>) => (
                      <td
                        key={column.key}
                        className={cn(
                          'px-3 py-2.5',
                          column.numeric && 'text-right tabular-nums',
                        )}
                      >
                        {column.render(row)}
                      </td>
                    )}
                  </Repeat>
                </tr>
              )}
            </Repeat>
          </Show>
        </tbody>
      </table>
    </div>
  );
}
