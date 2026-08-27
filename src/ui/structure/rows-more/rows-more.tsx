import type { ReactNode } from 'react';
import { Show } from 'meemaw';

import { KoboyoIcon, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';
import { Button } from '@ui/primitives';
import { Figure } from '@ui/display';
import { Status } from '@ui/status';
import { Provenance, isApproximate, type RecipeSource } from '@ui/domain';

/**
 * The ten remaining named row shapes.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/217-row-saved.html
 *                                                          222-row-audit.html … 231-row-nutrition.html
 *
 * **The shipped system had one generic row; the domain needs sixteen.** Each of
 * these carries a fact the others do not, and folding them into one component
 * with sixteen optional props is how a config format gets mistaken for a design
 * system.
 */

interface RowShellProps {
  readonly onPress?: () => void;
  /** At most ONE control. */
  readonly trailing?: ReactNode;
  readonly locked?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

function RowShell({ onPress, trailing, locked = false, className, children }: RowShellProps) {
  const interactive = onPress !== undefined && !locked;
  const content = (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-3">{children}</div>
      <Show when={trailing !== undefined}>
        <div className="shrink-0">{trailing}</div>
      </Show>
    </>
  );

  const classes = cn(
    'flex w-full items-center gap-3 px-pad py-row-y text-left',
    interactive && 'transition-colors duration-fast hover:bg-paper-2',
    locked && 'opacity-60',
    className,
  );

  if (interactive) {
    return (
      <li>
        <button
          type="button"
          onClick={onPress}
          className={cn(classes, 'focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_3px_var(--sky-glow)]')}
        >
          {content}
        </button>
      </li>
    );
  }
  return <li className={classes}>{content}</li>;
}

/* ---------- 217 · Saved recipe ---------- */

export interface SavedRowProps extends Omit<RowShellProps, 'children'> {
  readonly name: string;
  readonly source: RecipeSource;
  readonly minutes: number;
  /**
   * How many times it has been cooked. The shipped app modelled this in the
   * component and never populated it.
   */
  readonly cookedCount: number;
  readonly lastCooked?: string;
}

function RowSaved({ name, source, minutes, cookedCount, lastCooked, ...shell }: SavedRowProps) {
  return (
    <RowShell {...shell}>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-blade-xs border border-line-2 bg-dish-fill text-dish-line">
        <KoboyoIcon name="plateJollofRice" size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-ink">{name}</span>
        <span className="mt-[2px] flex flex-wrap items-center gap-2">
          <Provenance source={source} size="sm" />
          <span className="font-mono text-xs text-ink-3">
            <Figure value={minutes} unit="min" approximate={isApproximate(source)} size="sm" />
          </span>
        </span>
      </span>
      {/* The fact this row exists to carry. */}
      <span className="shrink-0 text-right">
        <Show when={cookedCount > 0}>
          <span className="block font-mono text-sm font-bold tnum text-ink">
            cooked {cookedCount}×
          </span>
          <Show when={lastCooked !== undefined}>
            <span className="block text-xs text-ink-3">last {lastCooked}</span>
          </Show>
        </Show>
        <Show when={cookedCount === 0}>
          <span className="block text-xs text-ink-4">not cooked yet</span>
        </Show>
      </span>
    </RowShell>
  );
}

/* ---------- 222 · AI audit ---------- */

export interface AuditRowProps extends Omit<RowShellProps, 'children'> {
  readonly kind: 'vision' | 'whisper' | 'parse' | 'generate';
  readonly result: 'ok' | 'error';
  readonly model: string;
  readonly latencyMs: number;
  readonly cost: string;
  readonly summary?: string;
}

/**
 * **The four kinds are visually distinct** — in the shipped row all four shared
 * one tone, in a list the curator scans for cost.
 */
function RowAudit({ kind, result, model, latencyMs, cost, summary, ...shell }: AuditRowProps) {
  return (
    <RowShell {...shell}>
      <Status kind="ai-kind" value={kind} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-mono text-sm text-ink">{model}</span>
        <span className="block truncate text-xs text-ink-3">
          <Figure value={latencyMs} unit="ms" size="sm" muted />
          {summary !== undefined && ` · ${summary}`}
        </span>
      </span>
      <Status kind="ai-result" value={result} size="sm" />
      <span className="w-[72px] shrink-0 text-right">
        <Figure value={cost} unit="$" size="sm" />
      </span>
    </RowShell>
  );
}

/* ---------- 223 · Feedback ---------- */

export interface FeedbackRowProps extends Omit<RowShellProps, 'children'> {
  readonly quote: string;
  readonly target: 'step' | 'ingredient';
  readonly status: 'open' | 'reviewed';
  /** "Step 3 · Jollof Rice · 2 days ago" */
  readonly context: string;
}

/** **The quote is the point**, so it gets the emphasis; metadata is subordinate. */
function RowFeedback({ quote, target, status, context, ...shell }: FeedbackRowProps) {
  return (
    <RowShell {...shell} className="items-start">
      <span className="min-w-0 flex-1">
        <span className="mb-1 flex flex-wrap items-center gap-2">
          <Status kind="feedback-target" value={target} size="sm" />
          <Status kind="feedback" value={status} size="sm" />
        </span>
        {/* The quote carries the weight. */}
        <span className="block text-ctrl text-ink">“{quote}”</span>
        <span className="mt-1 block truncate font-mono text-xs text-ink-3">{context}</span>
      </span>
    </RowShell>
  );
}

/* ---------- 224 · Feature flag ---------- */

export interface FlagRowProps extends Omit<RowShellProps, 'children'> {
  readonly flag: string;
  /** REQUIRED — what turning it off actually does. */
  readonly consequence: string;
  readonly on: boolean;
  readonly grave?: boolean;
}

/**
 * **The consequence is required.** Turning off signups means nobody can join —
 * the shipped admin surfaced that nowhere, so a cosmetic switch and a
 * business-stopping one looked identical.
 */
function RowFlag({ flag, consequence, on, grave = false, ...shell }: FlagRowProps) {
  return (
    <RowShell {...shell} className="items-start">
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <code className="font-mono text-sm font-bold text-ink">{flag}</code>
          <Status kind="flag" value={on ? 'on' : 'off'} size="sm" />
        </span>
        <span
          className={cn(
            'mt-1 block text-sm',
            grave ? 'font-extrabold text-critical-onsoft' : 'text-ink-2',
          )}
        >
          {consequence}
        </span>
      </span>
    </RowShell>
  );
}

/* ---------- 225 · Notification ---------- */

export interface NotificationRowProps extends Omit<RowShellProps, 'children'> {
  readonly title: string;
  readonly detail?: string;
  /** Relative — "2 hours ago" is what a person needs, not a timestamp. */
  readonly when: string;
  readonly unread: boolean;
  readonly icon?: KoboyoIconName;
}

function RowNotification({
  title,
  detail,
  when,
  unread,
  icon = 'bellNotification',
  ...shell
}: NotificationRowProps) {
  return (
    <RowShell {...shell} className={cn(unread && 'bg-sky-50')}>
      <span className="relative shrink-0">
        <span
          className={cn(
            'grid h-9 w-9 place-items-center rounded-round',
            unread ? 'bg-sky-soft text-sky-on' : 'bg-paper-2 text-ink-3',
          )}
        >
          <KoboyoIcon name={icon} size={17} />
        </span>
        {/* Unread carries a dot as well as the weight. */}
        <Show when={unread}>
          <span className="absolute -right-[2px] -top-[2px] h-[9px] w-[9px] rounded-round border-hair border-white bg-critical" />
        </Show>
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate', unread ? 'font-extrabold text-ink' : 'font-semibold text-ink-2')}>
          {title}
        </span>
        <span className="block truncate text-xs text-ink-3">
          {detail !== undefined && `${detail} · `}
          {when}
        </span>
      </span>
    </RowShell>
  );
}

/* ---------- 226 · Cuisine ---------- */

export interface CuisineRowProps extends Omit<RowShellProps, 'children'> {
  readonly cuisine: string;
  readonly count: number;
  readonly quickCount?: number;
}

/**
 * **The count is what makes it worth tapping** — a category with no number is a
 * guess about whether it is worth opening.
 */
function RowCuisine({ cuisine, count, quickCount, ...shell }: CuisineRowProps) {
  return (
    <RowShell {...shell}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-blade-xs bg-greens-fill text-greens-line">
        <KoboyoIcon name="plateFull" size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-ink">{cuisine}</span>
        <span className="block text-xs text-ink-3">
          <Figure value={count} unit="recipes" size="sm" muted />
          {quickCount !== undefined && ` · ${quickCount} under 30 minutes`}
        </span>
      </span>
    </RowShell>
  );
}

/* ---------- 227 · Recent session ---------- */

export interface RecentRowProps extends Omit<RowShellProps, 'children'> {
  /** What was in it — the date alone is not enough to recognise it by. */
  readonly items: readonly string[];
  readonly when: string;
  readonly onReuse?: () => void;
}

function RowRecent({ items, when, onReuse, ...shell }: RecentRowProps) {
  return (
    <RowShell
      {...shell}
      trailing={
        <Button variant="secondary" size="sm" onClick={onReuse}>
          Use again
        </Button>
      }
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-blade-xs bg-paper-2 text-ink-3">
        <KoboyoIcon name="historyClockArrow" size={18} />
      </span>
      <span className="min-w-0 flex-1">
        {/* What was in it, not just when. */}
        <span className="block truncate text-ctrl text-ink">{items.join(', ')}</span>
        <span className="block text-xs text-ink-3">
          {items.length} {items.length === 1 ? 'thing' : 'things'} · {when}
        </span>
      </span>
    </RowShell>
  );
}

/* ---------- 229 · Extraction ---------- */

export interface ExtractionRowProps extends Omit<RowShellProps, 'children'> {
  readonly kind: 'photo' | 'voice';
  readonly when: string;
  /** What was read from it. */
  readonly read: readonly string[];
  readonly uncertainCount?: number;
  readonly onView?: () => void;
}

/**
 * **The evidence trail** that makes a bad extraction diagnosable rather than a
 * mystery — the source is kept beside what was read from it.
 */
function RowExtraction({
  kind,
  when,
  read,
  uncertainCount = 0,
  onView,
  ...shell
}: ExtractionRowProps) {
  return (
    <RowShell
      {...shell}
      className="items-start"
      trailing={
        <Button variant="secondary" size="sm" onClick={onView}>
          View
        </Button>
      }
    >
      <span className="min-w-0 flex-1">
        <span className="mb-1 flex flex-wrap items-center gap-2">
          <Status kind="extraction" value={kind} size="sm" />
          <span className="font-mono text-xs text-ink-3">{when}</span>
        </span>
        <span className="block text-sm text-ink-2">
          {read.join(', ')}
          {uncertainCount > 0 && (
            <span className="ml-1 font-extrabold text-grape-onsoft">
              · {uncertainCount} unsure
            </span>
          )}
        </span>
      </span>
    </RowShell>
  );
}

/* ---------- 230 · Session ---------- */

export interface SessionRowProps extends Omit<RowShellProps, 'children'> {
  readonly device: string;
  /** Where — what tells a person whether a session is theirs. */
  readonly place: string;
  readonly lastActive: string;
  readonly current?: boolean;
  readonly onSignOut?: () => void;
}

function RowSession({
  device,
  place,
  lastActive,
  current = false,
  onSignOut,
  ...shell
}: SessionRowProps) {
  return (
    <RowShell
      {...shell}
      trailing={
        current ? (
          <span className="text-xs font-extrabold text-success-onsoft">This device</span>
        ) : (
          <Button variant="secondary" size="sm" destructive onClick={onSignOut}>
            Sign out
          </Button>
        )
      }
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-blade-xs bg-paper-2 text-ink-3">
        <KoboyoIcon name="phone" size={18} />
      </span>
      <span className="min-w-0 flex-1">
        {/* When AND where — that is what makes a session recognisable. */}
        <span className="block truncate font-semibold text-ink">
          {device} · {place}
        </span>
        <span className="block text-xs text-ink-3">last active {lastActive}</span>
      </span>
    </RowShell>
  );
}

/* ---------- 231 · Nutrition ---------- */

export interface NutritionRowProps extends Omit<RowShellProps, 'children'> {
  readonly label: string;
  readonly value: number;
  readonly unit: string;
}

/**
 * **Nutrition is always an estimate in this product, seed or AI** — so it
 * always carries the `≈` and never appears without the caveat.
 */
function RowNutrition({ label, value, unit, ...shell }: NutritionRowProps) {
  return (
    <RowShell {...shell}>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-ink">{label}</span>
        <span className="block text-xs text-ink-3">estimated from ingredients</span>
      </span>
      {/* Always approximate. There is no exact branch. */}
      <Figure value={value} unit={unit} approximate size="md" />
    </RowShell>
  );
}

export const RowMore = {
  Saved: RowSaved,
  Audit: RowAudit,
  Feedback: RowFeedback,
  Flag: RowFlag,
  Notification: RowNotification,
  Cuisine: RowCuisine,
  Recent: RowRecent,
  Extraction: RowExtraction,
  Session: RowSession,
  Nutrition: RowNutrition,
};

/**
 * A saved-recipe row, loading.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/217-row-saved.html
 *
 * Row-shaped at the true measure — a favourites list that loads through a
 * generic grey block jumps by tens of pixels per row when the real rows land.
 */
export function RowSavedSkeleton({ className }: { readonly className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('flex items-center gap-3 py-row-y', className)}
    >
      <span className="h-[52px] w-[52px] shrink-0 animate-shimmer rounded-blade-sm bg-paper-2" />
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="block h-[15px] w-2/3 animate-shimmer rounded-[3px] bg-paper-2" />
        <span className="block h-[12px] w-1/3 animate-shimmer rounded-[3px] bg-paper-2" />
      </span>
    </div>
  );
}
