import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Show } from 'meemaw';

import { KoboyoIcon, X, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';
import { Figure, PriceDisplay, Sparkline } from '@ui/display';
import { Status } from '@ui/status';
import { Avatar } from '@ui/structure';

/**
 * The console's data-display components.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview-admin/a02-dashboard.html
 *                                                                a05-ai-audit.html
 *              (Data display — 24: KPI cell/strip, six table cells, detail
 *               drawer, info card, stat delta, audit entry, metric tile,
 *               cost ledger line, empty-or-error)
 */

/* ---------- KPI ---------- */

export interface KpiCellProps {
  readonly label: string;
  readonly value: number | string;
  readonly unit?: string;
  readonly delta?: { readonly value: string; readonly direction: 'up' | 'down' | 'flat' };
  /** Trend data. A delta with no shape is a number without context. */
  readonly trend?: readonly number[];
  /** Marks the one figure that costs money. */
  readonly emphasis?: boolean;
  readonly className?: string;
}

/**
 * One number in the console's top strip.
 *
 * **A delta needs a direction AND a shape.** "+3.2%" alone does not say whether
 * that is a recovery or a spike — the sparkline is what makes it readable at a
 * glance, which is the only glance a dashboard gets.
 */
export function KpiCell({
  label,
  value,
  unit,
  delta,
  trend,
  emphasis = false,
  className,
}: KpiCellProps) {
  const deltaClass = {
    up: 'text-success-onsoft',
    down: 'text-critical-onsoft',
    flat: 'text-ink-3',
  }[delta?.direction ?? 'flat'];

  return (
    <div
      className={cn(
        'rounded-blade border p-4',
        emphasis ? 'border-ink bg-white shadow-drop-sm' : 'border-line-2 bg-white',
        className,
      )}
    >
      <p className="text-xs font-extrabold uppercase tracking-overline text-ink-3">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <Figure value={value} unit={unit} size="2xl" />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <Show when={delta !== undefined}>
          <span className={cn('text-xs font-extrabold', deltaClass)}>
            {delta?.direction === 'up' ? '↑' : delta?.direction === 'down' ? '↓' : '·'}{' '}
            {delta?.value}
          </span>
        </Show>
        <Show when={trend !== undefined && trend.length > 1}>
          <Sparkline
            data={[...(trend ?? [])]}
            label={`${label} trend`}
            width={64}
            height={20}
            tone={emphasis ? 'caution' : 'sky'}
          />
        </Show>
      </div>
    </div>
  );
}

export interface KpiStripProps {
  readonly children: ReactNode;
  readonly className?: string;
}

/** The row of KPIs at the top of a console screen. */
export function KpiStrip({ children, className }: KpiStripProps) {
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-5', className)}>{children}</div>
  );
}

/* ---------- Table cells ---------- */

/** A person, in a table cell. */
/** Visual spec: design-system/projects/kinnijije-v2/preview/92-table-cell.html */
export function CellAvatar({
  name,
  email,
}: {
  readonly name: string;
  readonly email: string;
}) {
  return <Avatar name={email} size={26} label={name} sublabel={email} />;
}

/** Money. Right-aligned by the table's `numeric` column flag. */
export function CellAmount({
  amount,
  currency,
  approximate = false,
}: {
  readonly amount: string;
  readonly currency?: string;
  readonly approximate?: boolean;
}) {
  return <PriceDisplay amount={amount} currency={currency} approximate={approximate} size="sm" />;
}

/** A date, always with its relative form — a raw timestamp is not scannable. */
export function CellDate({
  absolute,
  relative,
}: {
  readonly absolute: string;
  readonly relative: string;
}) {
  return (
    <span title={absolute} className="font-mono text-xs text-ink-2">
      {relative}
    </span>
  );
}

/** An id or reference. Monospace, truncated from the middle. */
export function CellRef({ value }: { readonly value: string }) {
  const short = value.length > 14 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;
  return (
    <code title={value} className="font-mono text-xs text-ink-3">
      {short}
    </code>
  );
}

/** The actions column. Always last, always the same width. */
export function CellActions({ children }: { readonly children: ReactNode }) {
  return <span className="flex items-center justify-end gap-1">{children}</span>;
}

/* ---------- Detail drawer ---------- */

export interface DetailDrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly subtitle?: ReactNode;
  /** Sticky at the bottom — the commit for whatever the drawer holds. */
  readonly footer?: ReactNode;
  readonly children: ReactNode;
}

/**
 * The console's side panel.
 *
 * **A drawer, not a modal**, because the curator needs the board still visible
 * behind it — the whole workflow is "look at this row against the others".
 */
export function DetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
}: DetailDrawerProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-modal flex justify-end">
      {/* A light scrim — the board stays readable behind it. */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="flex-1 bg-scrim/60"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="counter flex w-full max-w-[520px] flex-col border-l-bold border-ink bg-paper shadow-modal animate-slide-left"
      >
        <header className="flex items-start justify-between gap-3 border-b border-line bg-white px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-extrabold tracking-display">
              {title}
            </h2>
            <Show when={subtitle !== undefined}>
              <div className="mt-[2px] text-sm text-ink-3">{subtitle}</div>
            </Show>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-round text-ink-3 transition-colors hover:bg-paper-2 hover:text-ink"
          >
            <X size={16} strokeWidth={3} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

        <Show when={footer !== undefined}>
          <footer className="border-t border-line bg-white px-5 py-3">{footer}</footer>
        </Show>
      </div>
    </div>,
    document.body,
  );
}

export interface DetailRowProps {
  readonly label: string;
  readonly value: ReactNode;
  readonly className?: string;
}

/** One fact inside a drawer. Label left, value right, hairline between. */
export function DetailRow({ label, value, className }: DetailRowProps) {
  return (
    <div
      className={cn('flex items-baseline justify-between gap-4 border-b border-line py-2', className)}
    >
      <dt className="shrink-0 text-sm text-ink-3">{label}</dt>
      <dd className="min-w-0 text-right text-ctrl text-ink">{value}</dd>
    </div>
  );
}

/* ---------- Info card ---------- */

export interface InfoCardProps {
  readonly title: string;
  readonly children: ReactNode;
  readonly action?: ReactNode;
  readonly tone?: 'default' | 'caution' | 'critical';
  readonly className?: string;
}

/** A boxed note inside a console screen. */
export function InfoCard({ title, children, action, tone = 'default', className }: InfoCardProps) {
  const toneClass = {
    default: 'border-line-2 bg-white',
    caution: 'border-caution-border bg-caution-soft',
    critical: 'border-critical-border bg-critical-soft',
  }[tone];

  return (
    <div className={cn('rounded-blade border p-4', toneClass, className)}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="font-display text-md font-extrabold tracking-display">{title}</p>
        <Show when={action !== undefined}>
          <div className="shrink-0">{action}</div>
        </Show>
      </div>
      <div className="text-sm text-ink-2">{children}</div>
    </div>
  );
}

/* ---------- Metric tile · cost ledger ---------- */

export interface MetricTileProps {
  readonly label: string;
  readonly value: number | string;
  readonly unit?: string;
  readonly icon?: KoboyoIconName;
  readonly className?: string;
}

/** A single figure in a grid of peers. Quieter than a KPI cell. */
export function MetricTile({ label, value, unit, icon, className }: MetricTileProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-blade border border-line-2 bg-white p-3',
        className,
      )}
    >
      <Show when={icon !== undefined}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-blade-xs bg-paper-2 text-ink-3">
          <KoboyoIcon name={icon ?? 'info'} size={17} />
        </span>
      </Show>
      <div className="min-w-0">
        <p className="truncate text-xs text-ink-3">{label}</p>
        <Figure value={value} unit={unit} size="lg" />
      </div>
    </div>
  );
}

export interface CostLedgerLineProps {
  readonly kind: 'vision' | 'whisper' | 'parse' | 'generate';
  readonly calls: number;
  readonly cost: string;
  /** Share of the total, 0–1. */
  readonly share: number;
  readonly className?: string;
}

/**
 * One line of the AI cost breakdown.
 *
 * **The share bar is what makes it scannable** — four dollar figures in a
 * column all look similar; four bars do not, and the one that matters is
 * obvious without reading.
 */
export function CostLedgerLine({ kind, calls, cost, share, className }: CostLedgerLineProps) {
  return (
    <div className={cn('flex items-center gap-3 py-2', className)}>
      <span className="w-[96px] shrink-0">
        <Status kind="ai-kind" value={kind} size="sm" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block h-[6px] overflow-hidden rounded-pill bg-paper-3">
          <span
            className={cn('block h-full rounded-pill', share > 0.5 ? 'bg-caution' : 'bg-sky')}
            style={{ width: `${Math.round(share * 100)}%` }}
          />
        </span>
      </span>

      <span className="w-[72px] shrink-0 text-right font-mono text-xs tnum text-ink-3">
        {calls}
      </span>
      <span className="w-[80px] shrink-0 text-right">
        <PriceDisplay amount={cost} currency="$" size="sm" />
      </span>
    </div>
  );
}

/* ---------- Empty or error ---------- */

export interface EmptyOrErrorProps {
  /** `empty` succeeded with no rows; `error` failed. They are not the same. */
  readonly kind: 'empty' | 'error' | 'filtered';
  readonly title: string;
  readonly body?: string;
  readonly action?: ReactNode;
  readonly className?: string;
}

/**
 * A board with nothing in it.
 *
 * **Empty, filtered and error are three different states** and the console must
 * say which — "no results" covering a failed query is how a curator concludes
 * there are no recipes when the API is down.
 */
export function EmptyOrError({ kind, title, body, action, className }: EmptyOrErrorProps) {
  const icon: KoboyoIconName =
    kind === 'error' ? 'error' : kind === 'filtered' ? 'funnel' : 'emptyBox';

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-blade border border-dashed px-6 py-9 text-center',
        kind === 'error' ? 'border-critical-border bg-critical-soft' : 'border-line-2 bg-paper-2',
        className,
      )}
    >
      <KoboyoIcon
        name={icon}
        size={30}
        className={kind === 'error' ? 'text-critical' : 'text-ink-3'}
        alone
      />
      <p
        className={cn(
          'font-display text-md font-extrabold tracking-display',
          kind === 'error' && 'text-critical-onsoft',
        )}
      >
        {title}
      </p>
      <Show when={body !== undefined}>
        <p className="max-w-[46ch] text-sm text-ink-2">{body}</p>
      </Show>
      <Show when={action !== undefined}>
        <div className="mt-1">{action}</div>
      </Show>
    </div>
  );
}

/**
 * A cell loading, and a cell with no value.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/92-table-cell.html
 *
 * **Each cell has its own shape.** An avatar cell, an amount and a date shimmer
 * at different widths and alignments, because a column of identical grey bars
 * hides which column is which — exactly when an operator is trying to find one.
 */
export function CellSkeleton({
  shape = 'text',
}: {
  readonly shape?: 'avatar' | 'amount' | 'date' | 'ref' | 'text';
}) {
  if (shape === 'avatar') {
    return (
      <span aria-hidden="true" className="flex items-center gap-2.5">
        <span className="block h-[26px] w-[26px] shrink-0 animate-shimmer rounded-round bg-skeleton" />
        <span className="block h-[13px] w-28 animate-shimmer rounded-[3px] bg-skeleton" />
      </span>
    );
  }
  const widths = { amount: 56, date: 72, ref: 88, text: 104 } as const;
  const alignRight = shape === 'amount';
  return (
    <span aria-hidden="true" className={cn('block', alignRight && 'ml-auto')}>
      <span
        className="block h-[13px] animate-shimmer rounded-[3px] bg-skeleton"
        style={{ width: widths[shape] }}
      />
    </span>
  );
}

/** No value in this cell. An em dash — never a blank, never a zero. */
export function CellEmpty() {
  return (
    <span className="text-ink-4" aria-label="No value">
      —
    </span>
  );
}
