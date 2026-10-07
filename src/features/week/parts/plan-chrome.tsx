import type { ReactNode } from 'react';

import { Show } from 'meemaw';

import { ChevronLeft } from '@icons';
import { cn } from '@shared/utils/cn';

/**
 * The timetable's full-screen chrome, lifted from docs/v2/timetable.html.
 *
 * Every frame in §04 is the same three-part shell: a thin app bar, a scrolling
 * body, and a docked footer with the primary action. Building it once here is
 * what keeps seven frames consistent — and the class values are transcribed
 * from the spec's own CSS rather than approximated, because "100% fidelity"
 * means the 11px uppercase label and the 2px ink border, not something close.
 *
 * FULL SCREEN, not inside AppShell. The plan flow owns the viewport: the spec
 * draws it as a phone screen with its own bar and dock, and nesting it in the
 * app's tab bar would put two chromes on top of each other and steal the
 * height the day-by-day view needs.
 */

/**
 * `.screen` — the whole viewport, column, paper background.
 *
 * CENTRED AND CAPPED on desktop, like every other flow in the product. The
 * spec draws these frames as a phone, and letting them stretch to 1800px
 * turned a 76px label column into a third of the screen — the runway bars in
 * particular became unreadable ribbons.
 *
 * 520px matches the decide flow and `AskSheet`, so moving between them does
 * not change the measure. The bordered column reads as the phone frame the
 * design intends rather than as a stretched page.
 */
export function PlanScreen({ children }: { readonly children: ReactNode }) {
  return (
    <div className="flex h-dvh justify-center bg-paper-2">
      <div className="flex h-full w-full max-w-[520px] flex-col overflow-hidden bg-paper sm:border-x sm:border-line">
        {children}
      </div>
    </div>
  );
}

/**
 * `.appbar` — back control, title, optional actions.
 *
 * `title` can be a node so frame 03 can hand it a button: the spec makes the
 * title bar itself the jump control, "discoverable without a second icon
 * competing for the corner".
 */
export function PlanAppBar({
  title,
  onBack,
  actions,
}: {
  readonly title: ReactNode;
  readonly onBack?: (() => void) | undefined;
  readonly actions?: ReactNode;
}) {
  return (
    <div className="flex flex-none items-center gap-2.5 border-b-[1.5px] border-line bg-white px-3.5 py-[11px]">
      <Show when={onBack !== undefined}>
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="grid h-8 w-8 flex-none place-items-center rounded-blade-xs border-[1.5px] border-line-2 bg-white text-ink-2 transition-colors hover:border-ink hover:bg-paper-2"
        >
          <ChevronLeft size={15} strokeWidth={2.4} />
        </button>
      </Show>

      <div className="min-w-0 font-display text-[17px] font-extrabold text-ink">{title}</div>

      <Show when={actions !== undefined}>
        <div className="ml-auto flex gap-1.5">{actions}</div>
      </Show>
    </div>
  );
}

/**
 * `.body` — the one scrolling region.
 *
 * `min-h-0` is load-bearing: without it a flex child grows to its content and
 * the whole screen scrolls, carrying the dock away with it.
 */
export function PlanBody({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain p-3.5',
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * `.dock` — pinned footer, heavy top border.
 *
 * The 2px ink border is the spec's, and it matters: the dock has to read as a
 * separate surface from the body above it, not as the end of the scroll.
 */
export function PlanDock({ children }: { readonly children: ReactNode }) {
  return (
    <div className="flex flex-none flex-col gap-2 border-t-2 border-ink bg-white px-3.5 pb-[calc(env(safe-area-inset-bottom)+13px)] pt-3">
      {children}
    </div>
  );
}

/** `.label` — 11px, uppercase, wide tracking. Above every option row. */
export function PlanLabel({ children }: { readonly children: ReactNode }) {
  return (
    <div className="mb-[7px] text-[11px] font-extrabold uppercase tracking-[0.11em] text-ink-3">
      {children}
    </div>
  );
}

export type NoteTone = 'info' | 'ok' | 'warn' | 'crit' | 'grape';

const NOTE_TONE: Record<NoteTone, string> = {
  info: 'border-sky-edge border-l-sky bg-sky-soft text-sky-on',
  ok: 'border-success-border border-l-success bg-success-soft text-success-onsoft',
  warn: 'border-caution-border border-l-caution bg-caution-soft text-caution-onsoft',
  crit: 'border-critical-border border-l-critical bg-critical-soft text-critical-onsoft',
  grape: 'border-grape-border border-l-grape bg-grape-soft text-grape-onsoft',
};

/** `.appnote` — a hairline box with a 5px coloured left edge. */
export function PlanNote({
  tone = 'info',
  children,
}: {
  readonly tone?: NoteTone;
  readonly children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-blade-xs border-[1.5px] border-l-[5px] px-3 py-[11px] text-[12.5px]',
        NOTE_TONE[tone],
      )}
    >
      {children}
    </div>
  );
}

/**
 * `.pill` — the option control, used by every row in frame 01.
 *
 * A pill is one of only two exceptions to the blade in the whole system (the
 * other is a circle), which is why this is a `rounded-pill` and not a mistake.
 */
export function PlanPill({
  children,
  active = false,
  onClick,
  plus = false,
  ariaLabel,
}: {
  readonly children: ReactNode;
  readonly active?: boolean;
  readonly onClick: () => void;
  /** The `+` that opens the number panel. Sky-tinted, never moves. */
  readonly plus?: boolean;
  readonly ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...(ariaLabel !== undefined && { 'aria-label': ariaLabel })}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill border-2 px-[11px] py-[5px] text-[11.5px] font-extrabold transition-all duration-fast',
        active
          ? 'border-ink bg-sky text-white shadow-drop-sm'
          : plus
            ? 'border-sky-edge bg-sky-50 text-sky-deep hover:border-sky-deep hover:bg-sky-soft'
            : 'border-line-2 bg-white text-ink-2 hover:border-ink',
      )}
    >
      {children}
    </button>
  );
}

/** `.opts` — the wrapping row every set of pills sits in. */
export function PlanOptions({ children }: { readonly children: ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

/** `.btn.lg` — the dock's primary action. */
export function PlanButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
}: {
  readonly children: ReactNode;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly variant?: 'primary' | 'ghost' | 'quiet';
}) {
  const inert = disabled || loading;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={inert}
      className={cn(
        'inline-flex w-full items-center justify-center gap-2 font-extrabold transition-transform duration-press',
        variant === 'quiet'
          ? 'min-h-[38px] border-2 border-transparent bg-transparent text-[14.5px] font-bold text-ink-3 shadow-none hover:text-ink'
          : variant === 'ghost'
            ? 'min-h-[46px] rounded-blade-xs border-2 border-line-2 bg-white px-5 text-[14.5px] text-ink shadow-none hover:border-ink hover:bg-paper-2'
            : 'min-h-[54px] rounded-blade-sm border-2 border-ink bg-sky px-5 text-[16.5px] text-white shadow-drop hover:bg-sky-deep',
        variant === 'primary' && !inert && 'active:translate-x-[2px] active:translate-y-[3px] active:shadow-none',
        inert && 'cursor-not-allowed opacity-60',
      )}
    >
      {children}
    </button>
  );
}

/** `.tag` — the small status chip used on slots and runway rows. */
export function PlanTag({
  children,
  tone = 'neutral',
}: {
  readonly children: ReactNode;
  readonly tone?: 'neutral' | 'ok' | 'warn' | 'crit' | 'grape';
}) {
  const tones: Record<string, string> = {
    neutral: 'border-line-2 bg-paper-2 text-ink-3',
    ok: 'border-success-border bg-success-soft text-success-onsoft',
    warn: 'border-caution-border bg-caution-soft text-caution-onsoft',
    crit: 'border-critical-border bg-critical-soft text-critical-onsoft',
    grape: 'border-grape-border bg-grape-soft text-grape-onsoft',
  };

  return (
    <span
      className={cn(
        /*
         * LOWERCASE, matching the design's "all in stock" / "leftover" chips.
         * It was `uppercase`, which shouted "ALL IN STOCK" at the same weight
         * as the dish name and made every slot look like a warning.
         */
        'inline-flex items-center rounded-pill border px-2.5 py-0.5 text-[11px] font-bold',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
