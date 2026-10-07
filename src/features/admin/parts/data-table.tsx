import type { ReactNode } from 'react';

import { Repeat, Show } from 'meemaw';

import { cn } from '@shared/utils/cn';

export interface Column<T> {
  readonly key: string;
  /** Usually a label; a node for the rare header that is a control, like select-all. */
  readonly header: ReactNode;
  readonly render: (row: T) => ReactNode;
  /** Numbers read better right-aligned and tabular. */
  readonly numeric?: boolean;
}

/**
 * The console's one table.
 *
 * Every list screen uses it, so sorting out row density, empty state and the
 * loading shape once fixes them everywhere.
 *
 * ON A PHONE IT SCROLLS SIDEWAYS WITH THE FIRST COLUMN PINNED. Console tables
 * carry six or seven columns and will not fit a 390px screen, so they scroll —
 * and once they scroll, the column that says WHICH ROW you are reading slides
 * away and every remaining value becomes an orphan number. Pinning the first
 * column keeps the label in view the whole way across.
 */
export function DataTable<T>({
  rows,
  columns,
  isLoading,
  empty,
  onRowClick,
  rowKey,
  pinFirstColumn = true,
}: {
  readonly rows: readonly T[];
  readonly columns: readonly Column<T>[];
  readonly isLoading: boolean;
  readonly empty: string;
  readonly onRowClick?: (row: T) => void;
  readonly rowKey: (row: T) => string;
  /**
   * Pass `false` when the first column is a checkbox or an avatar, where
   * pinning buys nothing and costs width.
   */
  readonly pinFirstColumn?: boolean;
}) {
  /** Only worth pinning when there is something to scroll past it. */
  const pinned = pinFirstColumn && columns.length > 1;

  /**
   * The pinned cell needs an OPAQUE background of its own, or the scrolling
   * columns slide visibly underneath it and it reads as a rendering fault.
   * `group-hover` keeps it matching the row, so hovering does not leave the
   * pinned cell a different colour from the rest of its own row.
   */
  const pinnedCell = (isPinned: boolean): string =>
    cn(
      isPinned && 'sticky left-0 z-base bg-white',
      isPinned && onRowClick !== undefined && 'transition-colors group-hover:bg-sky-soft',
    );

  return (
    <div className="overflow-x-auto overscroll-x-contain rounded-blade border border-line bg-white">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-line">
            <Repeat each={[...columns]}>
              {(column: Column<T>, index: number) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-3 py-2.5 font-mono text-xs uppercase tracking-overline text-ink-3',
                    column.numeric ? 'text-right' : 'text-left',
                    pinned && index === 0 && 'sticky left-0 z-base bg-white',
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
                    {(column: Column<T>, columnIndex: number) => (
                      <td
                        key={column.key}
                        className={cn(
                          'px-3 py-2.5',
                          pinned && columnIndex === 0 && 'sticky left-0 z-base bg-white',
                        )}
                      >
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
                    'group border-b border-line/60',
                    onRowClick !== undefined &&
                      'cursor-pointer transition-colors hover:bg-sky-soft focus-visible:bg-sky-soft focus-visible:outline-none',
                  )}
                >
                  <Repeat each={[...columns]}>
                    {(column: Column<T>, columnIndex: number) => (
                      <td
                        key={column.key}
                        className={cn(
                          'px-3 py-2.5',
                          column.numeric && 'text-right tabular-nums',
                          pinnedCell(pinned && columnIndex === 0),
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
