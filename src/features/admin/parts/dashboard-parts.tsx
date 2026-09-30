import type { ReactNode } from 'react';

import { cn } from '@shared/utils/cn';
import type { DailyCount } from '../services/admin.api';

/**
 * The pieces the dashboard needs and nothing else does.
 *
 * Kept out of `@ui/admin` deliberately: a shared module earns its place by
 * being used twice, and putting a one-screen component there makes the design
 * system look larger than it is.
 */

/* ── Trend ───────────────────────────────────────────────────────────── */

/**
 * A period-over-period change.
 *
 * Renders NOTHING when the backend sends null, which it does when the previous
 * period was zero. "▲ ∞%" and a confident "▲ 100%" are both lies about a base
 * that did not exist, and a missing badge is the honest alternative.
 */
export function Trend({ value }: { readonly value: number | null }) {
  if (value === null) return null;

  const tone =
    value > 0 ? 'bg-success-soft text-success-onsoft'
    : value < 0 ? 'bg-critical-soft text-critical-onsoft'
    : 'bg-paper-2 text-ink-3';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-pill px-1.5 py-0.5 text-[11.5px] font-extrabold',
        tone,
      )}
    >
      {value > 0 ? '▲' : value < 0 ? '▼' : '■'} {Math.abs(value)}%
    </span>
  );
}

/* ── Sparkline ───────────────────────────────────────────────────────── */

/**
 * Fourteen days, behind the number rather than beside it.
 *
 * Purely decorative — `aria-hidden`, with no axis and no labels. The figure
 * above it is the information; this only says which way it has been going.
 * A flat series renders a flat line rather than dividing by zero.
 */
export function Sparkline({
  points,
  tone = 'sky',
}: {
  readonly points: DailyCount[];
  readonly tone?: 'sky' | 'grape';
}) {
  if (points.length < 2) return null;

  const counts = points.map((p) => p.count);
  const max = Math.max(...counts);
  const min = Math.min(...counts);
  const span = max - min || 1;

  const step = 200 / (points.length - 1);
  const y = (n: number): number => 36 - ((n - min) / span) * 30;

  const line = counts.map((n, i) => `${String(i * step)},${String(y(n))}`).join(' L');
  const stroke = tone === 'grape' ? 'var(--grape)' : 'var(--sky)';
  const fill = tone === 'grape' ? 'var(--grape-soft)' : 'var(--sky-100)';

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 40"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-10 w-full opacity-50"
    >
      <path d={`M${line} L200,40 L0,40 Z`} fill={fill} />
      <path d={`M${line}`} fill="none" stroke={stroke} strokeWidth="2" />
    </svg>
  );
}

/* ── Hero KPI ────────────────────────────────────────────────────────── */

interface HeroKpiProps {
  readonly label: string;
  readonly value: string;
  /** Rendered smaller, for a value with its own unit baked in. */
  readonly compact?: boolean;
  readonly lead?: boolean;
  readonly trend?: number | null;
  readonly meta?: ReactNode;
  readonly points?: DailyCount[];
  readonly tone?: 'sky' | 'grape';
}

/** One of the four figures at the top. Four, not seven: see the redesign doc. */
export function HeroKpi({
  label,
  value,
  compact = false,
  lead = false,
  trend = null,
  meta,
  points,
  tone = 'sky',
}: HeroKpiProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-blade border-2 border-ink bg-white p-4 shadow-drop',
        lead && 'bg-gradient-to-br from-sky-50 to-white',
      )}
    >
      {points !== undefined && <Sparkline points={points} tone={tone} />}

      <p className="relative m-0 text-[10.5px] font-extrabold uppercase tracking-overline text-ink-3">
        {label}
      </p>
      <div
        className={cn(
          'relative mt-1.5 font-display font-extrabold leading-none tracking-display tnum',
          compact ? 'text-[30px]' : 'text-[38px]',
        )}
      >
        {value}
      </div>
      <p className="relative m-0 mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px] text-ink-3">
        <Trend value={trend} />
        {meta}
      </p>
    </div>
  );
}

/* ── Proportion bar ──────────────────────────────────────────────────── */

export interface Segment {
  readonly label: string;
  readonly value: number;
  readonly colour: string;
}

/**
 * A breakdown shown as a proportion rather than listed as numbers.
 *
 * Replaces the old `Breakdown` list: "871 / 399 / 14" makes somebody do the
 * division themselves, and the whole point of a dashboard is that they should
 * not have to. Zero-value segments are dropped so they cannot render a sliver
 * that reads as a real share.
 */
export function ProportionBar({ segments }: { readonly segments: readonly Segment[] }) {
  const shown = segments.filter((s) => s.value > 0);
  const total = shown.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return null;

  return (
    <>
      <div
        className="flex h-[7px] overflow-hidden rounded-pill bg-paper-3"
        role="img"
        aria-label={shown.map((s) => `${String(s.value)} ${s.label}`).join(', ')}
      >
        {shown.map((s) => (
          <i
            key={s.label}
            className="block h-full"
            style={{ width: `${String((s.value / total) * 100)}%`, background: s.colour }}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1 text-[12px] text-ink-2">
        {shown.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5">
            <i className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: s.colour }} />
            {s.value.toLocaleString()} {s.label}
          </span>
        ))}
      </div>
    </>
  );
}

/* ── Stat rows ───────────────────────────────────────────────────────── */

export function StatRows({ children }: { readonly children: ReactNode }) {
  return <div className="flex flex-col">{children}</div>;
}

export function StatRow({
  label,
  hint,
  value,
  tone = 'default',
}: {
  readonly label: string;
  readonly hint?: string;
  readonly value: string;
  readonly tone?: 'default' | 'critical';
}) {
  return (
    <div className="flex items-center gap-3 border-b border-line py-2.5 first:pt-0 last:border-b-0 last:pb-0">
      <span className="min-w-0 flex-1 text-[13.5px] text-ink-2">
        {label}
        {hint !== undefined && <span className="block text-[11.5px] text-ink-4">{hint}</span>}
      </span>
      <span
        className={cn(
          'shrink-0 text-[17px] font-extrabold tnum',
          tone === 'critical' && 'text-critical-onsoft',
        )}
      >
        {value}
      </span>
    </div>
  );
}

/* ── Section heading ─────────────────────────────────────────────────── */

export function Section({
  title,
  hint,
  action,
  children,
}: {
  readonly title: string;
  readonly hint?: string;
  readonly action?: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <section className="mt-8 first:mt-0">
      <div className="mb-3 flex items-baseline gap-2.5">
        <h2 className="m-0 font-display text-[18px] font-extrabold text-ink">{title}</h2>
        {hint !== undefined && <span className="text-[12.5px] text-ink-3">{hint}</span>}
        <span className="h-[1.5px] flex-1 rounded-sm bg-line" />
        {action}
      </div>
      {children}
    </section>
  );
}

/* ── Chip ────────────────────────────────────────────────────────────── */

export function Chip({
  tone = 'default',
  children,
}: {
  readonly tone?: 'default' | 'good' | 'warn' | 'bad' | 'ai';
  readonly children: ReactNode;
}) {
  const tones = {
    default: 'bg-paper-2 text-ink-3',
    good: 'bg-success-soft text-success-onsoft',
    warn: 'bg-caution-soft text-caution-onsoft',
    bad: 'bg-critical-soft text-critical-onsoft',
    ai: 'bg-grape-soft text-grape-onsoft',
  } as const;

  return (
    <span
      className={cn(
        'rounded-pill px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wide',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
