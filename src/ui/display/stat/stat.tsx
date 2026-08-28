import { KoboyoIcon, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';
import { Figure, FigureSkeleton } from '../figure/figure';

/**
 * The everyday metric.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/82-stat.html
 *                                                          83-stat-compact.html
 *                                                          84-stat-icon.html
 *
 * **The value is the loudest object**, the label is small above it, and the
 * trend is subordinate to both. A stat that leads with its label makes a
 * dashboard read as a form.
 *
 * The value renders through `Figure` — a stat cannot format its own number, or
 * two stats on one screen will disagree about thousands separators.
 */

export type StatWeight = 'standard' | 'compact' | 'icon';

export interface StatProps {
  readonly label: string;
  /** `undefined` renders the em-dash empty state, never a zero. */
  readonly value: number | string | undefined;
  /** A subordinate trend line — "+12 this week", "1,204 calls". */
  readonly delta?: string;
  /** Colours the delta. Omit for a neutral note rather than a judgement. */
  readonly deltaTone?: 'success' | 'critical' | 'neutral';
  readonly unit?: string;
  readonly approximate?: boolean;
  readonly weight?: StatWeight;
  readonly icon?: KoboyoIconName;
  /** Cached — renders with its age. */
  readonly staleLabel?: string;
  /** This metric failed; the grid keeps its shape. */
  readonly error?: string;
  /** No data for this window. */
  readonly emptyLabel?: string;
  readonly className?: string;
}

const DELTA_CLASS = {
  success: 'text-success-onsoft',
  critical: 'text-critical-onsoft',
  neutral: 'text-ink-3',
} as const;

export function Stat({
  label,
  value,
  delta,
  deltaTone = 'neutral',
  unit,
  approximate = false,
  weight = 'standard',
  icon,
  staleLabel,
  error,
  emptyLabel,
  className,
}: StatProps) {
  const compact = weight === 'compact';
  const hasValue = value !== undefined && error === undefined;

  return (
    <div
      className={cn(
        'flex rounded-blade border border-line-2 bg-white',
        compact ? 'flex-col gap-[2px] p-3' : 'flex-col gap-1 p-4',
        weight === 'icon' && 'flex-row items-center gap-3',
        className,
      )}
    >
      {weight === 'icon' && icon !== undefined && (
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-blade-xs bg-sky-soft text-sky-on">
          <KoboyoIcon name={icon} size={22} />
        </span>
      )}

      <div className="min-w-0">
        <p
          className={cn(
            'font-extrabold uppercase tracking-overline text-ink-3',
            compact ? 'text-[10px]' : 'text-xs',
          )}
        >
          {label}
        </p>

        {hasValue ? (
          <Figure
            value={value}
            unit={unit}
            approximate={approximate}
            size={compact ? 'lg' : '2xl'}
          />
        ) : (
          <p
            className={cn(
              'font-mono font-bold tnum text-ink-4',
              compact ? 'text-lg' : 'text-2xl',
            )}
          >
            —
          </p>
        )}

        {error !== undefined && (
          <p className="mt-1 text-xs font-extrabold text-critical-onsoft">{error}</p>
        )}
        {error === undefined && !hasValue && emptyLabel !== undefined && (
          <p className="mt-1 text-xs text-ink-3">{emptyLabel}</p>
        )}
        {error === undefined && hasValue && delta !== undefined && (
          <p className={cn('mt-1 text-xs font-extrabold', DELTA_CLASS[deltaTone])}>{delta}</p>
        )}
        {staleLabel !== undefined && (
          <p className="mt-1 text-xs text-ink-4">{staleLabel}</p>
        )}
      </div>
    </div>
  );
}

/** Same box, same measure — the grid never reflows when data lands. */
export function StatSkeleton({ weight = 'standard' }: { readonly weight?: StatWeight }) {
  const compact = weight === 'compact';
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex flex-col gap-2 rounded-blade border border-line-2 bg-white',
        compact ? 'p-3' : 'p-4',
      )}
    >
      <div className="h-[12px] w-1/2 animate-shimmer rounded-[3px] bg-skeleton" />
      <FigureSkeleton size={compact ? 'lg' : '2xl'} width={92} />
      <div className="h-[12px] w-2/5 animate-shimmer rounded-[3px] bg-skeleton" />
    </div>
  );
}
