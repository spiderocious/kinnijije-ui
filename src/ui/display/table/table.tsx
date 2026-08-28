import type { ReactNode } from 'react';
import { Repeat, Show } from 'meemaw';

import { ChevronDown, ChevronUp } from '@icons';
import { cn } from '@shared/utils/cn';
import { Button } from '@ui/primitives';

/**
 * The table the curator never had.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/91-table.html
 *                                                          92-table-cell.html
 *
 * **The shipped app contains ZERO `<table>` markup.** Four admin record lists,
 * all rendered as stacks of cards — so no column headers, no alignment, no
 * scanning down a column, in an app whose entire job is comparing records.
 *
 * Figures render through `Figure`, so a numeric column aligns by construction
 * rather than by every cell remembering to be monospace.
 *
 * **No page-number pagination.** The API is cursor-only — see `CursorPager`.
 */

export type SortDirection = 'asc' | 'desc';

export interface TableColumn<T> {
  readonly key: string;
  readonly header: string;
  /** Right-aligns and forces tabular figures. */
  readonly numeric?: boolean;
  readonly sortable?: boolean;
  readonly width?: string;
  readonly render: (row: T) => ReactNode;
}

export interface TableProps<T> {
  readonly columns: readonly TableColumn<T>[];
  readonly rows: readonly T[];
  readonly rowKey: (row: T) => string;
  readonly sort?: { readonly key: string; readonly direction: SortDirection };
  readonly onSortChange?: (key: string, direction: SortDirection) => void;
  readonly onRowClick?: (row: T) => void;
  readonly stickyHeader?: boolean;
  /** Re-sorting — existing rows stay and dim. */
  readonly loading?: boolean;
  readonly caption?: string;
  readonly className?: string;
}

export function Table<T>({
  columns,
  rows,
  rowKey,
  sort,
  onSortChange,
  onRowClick,
  stickyHeader = false,
  loading = false,
  caption,
  className,
}: TableProps<T>) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse text-left">
        {caption !== undefined && <caption className="sr-only">{caption}</caption>}

        <thead>
          <tr>
            <Repeat each={[...columns] as TableColumn<T>[]}>
              {(column: TableColumn<T>) => {
                const sorted = sort?.key === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={
                      sorted ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined
                    }
                    style={column.width !== undefined ? { width: column.width } : undefined}
                    className={cn(
                      'border-b-bold border-ink pb-2 pr-3 text-xs font-extrabold uppercase tracking-overline text-ink-3',
                      column.numeric === true && 'pr-0 text-right',
                      stickyHeader && 'sticky top-0 z-sticky bg-paper',
                    )}
                  >
                    {column.sortable === true && onSortChange !== undefined ? (
                      <button
                        type="button"
                        onClick={() =>
                          onSortChange(
                            column.key,
                            sorted && sort.direction === 'asc' ? 'desc' : 'asc',
                          )
                        }
                        className={cn(
                          'inline-flex items-center gap-1 uppercase tracking-overline',
                          'transition-colors hover:text-ink focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]',
                          sorted && 'text-ink',
                          column.numeric === true && 'flex-row-reverse',
                        )}
                      >
                        {column.header}
                        {sorted &&
                          (sort.direction === 'asc' ? (
                            <ChevronUp size={13} strokeWidth={3} />
                          ) : (
                            <ChevronDown size={13} strokeWidth={3} />
                          ))}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              }}
            </Repeat>
          </tr>
        </thead>

        {/* Re-sorting keeps the existing rows and dims them — a table that
            empties while it re-sorts loses the curator's place. */}
        <tbody className={cn(loading && 'opacity-50 transition-opacity duration-fast')}>
          <Repeat each={[...rows] as T[]}>
            {(row: T) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick === undefined ? undefined : () => onRowClick(row)}
                className={cn(
                  'border-b border-line',
                  onRowClick !== undefined && 'cursor-pointer transition-colors hover:bg-sky-soft',
                )}
              >
                <Repeat each={[...columns] as TableColumn<T>[]}>
                  {(column: TableColumn<T>) => (
                    <td
                      key={column.key}
                      className={cn(
                        'py-row-y pr-3 align-middle text-ctrl',
                        column.numeric === true && 'pr-0 text-right font-mono tnum',
                      )}
                    >
                      {column.render(row)}
                    </td>
                  )}
                </Repeat>
              </tr>
            )}
          </Repeat>
        </tbody>
      </table>
    </div>
  );
}

/** Head stays; rows shimmer at the true row height. */
export function TableSkeleton({
  columns,
  rows = 5,
}: {
  readonly columns: readonly { readonly key: string; readonly header: string }[];
  readonly rows?: number;
}) {
  return (
    <table aria-hidden="true" className="w-full border-collapse text-left">
      <thead>
        <tr>
          <Repeat each={[...columns]}>
            {(column: { key: string; header: string }) => (
              <th
                key={column.key}
                className="border-b-bold border-ink pb-2 pr-3 text-xs font-extrabold uppercase tracking-overline text-ink-3"
              >
                {column.header}
              </th>
            )}
          </Repeat>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }, (_, index) => (
          <tr key={index} className="border-b border-line">
            <Repeat each={[...columns]}>
              {(column: { key: string }) => (
                <td key={column.key} className="py-row-y pr-3">
                  <span className="block h-[18px] animate-shimmer rounded-[4px] bg-skeleton" />
                </td>
              )}
            </Repeat>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export interface CursorPagerProps {
  /** Descriptive range — "21–40". Never "page 2 of 9". */
  readonly rangeLabel: string;
  readonly hasPrev: boolean;
  readonly hasMore: boolean;
  readonly onPrev: () => void;
  readonly onNext: () => void;
  readonly loading?: boolean;
  readonly className?: string;
}

/**
 * Prev / next and a range — the control the API can actually serve.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/93-cursor-pager.html
 *
 * **The API is cursor-only** — no offset, no total count. So a page-number
 * control is literally unservable, and designing one would specify a thing the
 * backend cannot do. There is no `page` or `total` prop, and the range is
 * descriptive ("21–40"), never "page 2 of 9".
 */
export function CursorPager({
  rangeLabel,
  hasPrev,
  hasMore,
  onPrev,
  onNext,
  loading = false,
  className,
}: CursorPagerProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3 py-3', className)}>
      <Button variant="secondary" size="sm" disabled={!hasPrev || loading} onClick={onPrev}>
        Previous
      </Button>

      <Show when={rangeLabel !== ''}>
        <span className="font-mono text-xs tnum text-ink-3">{rangeLabel}</span>
      </Show>

      <Button
        variant="secondary"
        size="sm"
        disabled={!hasMore}
        loading={loading}
        onClick={onNext}
      >
        Next
      </Button>
    </div>
  );
}

/**
 * Query failed.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/91-table.html
 *
 * **The header row survives.** A table that collapses to a bare message on
 * failure throws away the column names, which are the one part of the answer
 * that did not depend on the query — and it makes the panel jump to a different
 * height than every successful sibling on the board.
 */
export function TableError({
  columns,
  message = 'This table could not load',
  onRetry,
}: {
  readonly columns: readonly { readonly key: string; readonly header: string }[];
  readonly message?: string;
  readonly onRetry?: () => void;
}) {
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr>
          <Repeat each={[...columns]}>
            {(column: { key: string; header: string }) => (
              <th
                key={column.key}
                className="border-b-bold border-ink pb-2 pr-3 text-xs font-extrabold uppercase tracking-overline text-ink-3"
              >
                {column.header}
              </th>
            )}
          </Repeat>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colSpan={columns.length} className="py-12 text-center">
            <span className="flex flex-col items-center gap-2">
              <span className="text-sm font-extrabold text-ink-2">{message}</span>
              <Show when={onRetry !== undefined}>
                <button
                  type="button"
                  onClick={onRetry}
                  className="text-xs font-extrabold text-sky hover:underline"
                >
                  Try again
                </button>
              </Show>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
