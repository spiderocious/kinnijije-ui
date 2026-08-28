import { useState, type ReactNode } from 'react';
import { Repeat, Show } from 'meemaw';

import { ChevronDown, KoboyoIcon, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';
import { Progress } from '@ui/feedback';

/**
 * Content-shaped display components.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/97-progress-content.html
 *                                                          98-accordion.html
 *                                                          99-media.html
 *                                                          100-media-container.html
 *                                                          101-banner-data.html
 *                                                          102-timeline.html
 */

/* ---------- Accordion ---------- */

export interface AccordionItem {
  readonly id: string;
  readonly title: string;
  readonly body: ReactNode;
  /** A count or status beside the title. */
  readonly meta?: ReactNode;
  /**
   * Section unavailable — gated, or nothing to show inside it.
   *
   * The row STAYS in the list, dimmed and unopenable. Dropping it would change
   * the list's shape between users and make the section impossible to describe
   * to someone who cannot see it.
   */
  readonly disabled?: boolean;
}

export interface AccordionProps {
  readonly items: readonly AccordionItem[];
  /** One at a time, or many. Defaults to many — closing to open is friction. */
  readonly exclusive?: boolean;
  readonly defaultOpen?: readonly string[];
  /** Shown instead of an empty bordered box when there are no items. */
  readonly emptyMessage?: string;
  readonly className?: string;
}

/** Visual spec: design-system/projects/kinnijije-v2/preview/98-accordion.html */
export function Accordion({
  items,
  exclusive = false,
  defaultOpen = [],
  emptyMessage = 'No entries',
  className,
}: AccordionProps) {
  const [open, setOpen] = useState<readonly string[]>(defaultOpen);

  // No entries. Says so rather than rendering an empty bordered box, which
  // reads as a section that failed to load rather than one with nothing in it.
  if (items.length === 0) {
    return <p className={cn('text-sm text-ink-4', className)}>{emptyMessage}</p>;
  }

  function toggle(id: string) {
    setOpen((current) => {
      if (current.includes(id)) return current.filter((i) => i !== id);
      return exclusive ? [id] : [...current, id];
    });
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Repeat each={[...items]}>
        {(item: AccordionItem) => {
          const isOpen = open.includes(item.id);
          return (
            <div
              key={item.id}
              className="overflow-hidden rounded-blade border border-line-2 bg-white"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                disabled={item.disabled === true}
                onClick={() => toggle(item.id)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_3px_var(--sky-glow)]',
                  item.disabled === true
                    ? 'cursor-not-allowed opacity-[0.42]'
                    : 'hover:bg-paper-2',
                )}
              >
                <span className="min-w-0 flex-1 font-display text-md font-extrabold tracking-display">
                  {item.title}
                </span>
                <Show when={item.meta !== undefined}>
                  <span className="shrink-0">{item.meta}</span>
                </Show>
                <ChevronDown
                  size={17}
                  aria-hidden="true"
                  className={cn(
                    'shrink-0 text-ink-3 transition-transform duration-fast',
                    isOpen && 'rotate-180',
                  )}
                />
              </button>

              <Show when={isOpen}>
                <div className="border-t border-line px-4 py-3 text-ctrl text-ink-2 animate-fade">
                  {item.body}
                </div>
              </Show>
            </div>
          );
        }}
      </Repeat>
    </div>
  );
}

/* ---------- Media ---------- */

export interface MediaProps {
  /** A thumbnail, an icon block, an avatar. */
  readonly media: ReactNode;
  readonly title: ReactNode;
  readonly body?: ReactNode;
  readonly meta?: ReactNode;
  /** At most one control. */
  readonly action?: ReactNode;
  readonly align?: 'start' | 'center';
  readonly className?: string;
}

/**
 * The media object — a thing beside a description.
 *
 * The oldest layout on the web and still the one most often re-hand-written.
 * Having it once is what stops the eleventh site inventing a twelfth spacing.
 */
/** Visual spec: design-system/projects/kinnijije-v2/preview/99-media.html */
export function Media({
  media,
  title,
  body,
  meta,
  action,
  align = 'start',
  className,
}: MediaProps) {
  return (
    <div
      className={cn('flex gap-3', align === 'center' ? 'items-center' : 'items-start', className)}
    >
      <div className="shrink-0">{media}</div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-ink">{title}</div>
        <Show when={body !== undefined}>
          <div className="mt-[2px] text-sm text-ink-2">{body}</div>
        </Show>
        <Show when={meta !== undefined}>
          <div className="mt-1 text-xs text-ink-3">{meta}</div>
        </Show>
      </div>
      <Show when={action !== undefined}>
        <div className="shrink-0">{action}</div>
      </Show>
    </div>
  );
}

export interface MediaContainerProps {
  readonly ratio?: '1/1' | '4/3' | '16/9' | '3/2';
  /** The type-led degrade when there is no image. */
  readonly fallbackIcon?: KoboyoIconName;
  readonly src?: string;
  readonly alt?: string;
  /** A tag pinned to the corner — "AI image". */
  readonly badge?: ReactNode;
  readonly className?: string;
}

/**
 * A fixed-ratio media frame.
 *
 * **The ratio is held whether or not an image loads**, so a grid never reflows
 * as photography arrives — which is what makes the type-led degrade usable
 * rather than a layout bug.
 */
/** Visual spec: design-system/projects/kinnijije-v2/preview/100-media-container.html */
export function MediaContainer({
  ratio = '4/3',
  fallbackIcon = 'plateJollofRice',
  src,
  alt = '',
  badge,
  className,
}: MediaContainerProps) {
  const ratioClass = {
    '1/1': 'aspect-square',
    '4/3': 'aspect-[4/3]',
    '16/9': 'aspect-video',
    '3/2': 'aspect-[3/2]',
  }[ratio];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-blade-sm border border-ink bg-dish-fill',
        ratioClass,
        className,
      )}
    >
      {src !== undefined ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center text-dish-line">
          <KoboyoIcon name={fallbackIcon} size={40} alone />
        </div>
      )}
      <Show when={badge !== undefined}>
        <span className="absolute bottom-2 right-2">{badge}</span>
      </Show>
    </div>
  );
}

/* ---------- Data banner ---------- */

export interface DataBannerProps {
  readonly label: string;
  readonly value: ReactNode;
  readonly icon?: KoboyoIconName;
  readonly tone?: 'neutral' | 'sky' | 'success' | 'caution';
  readonly action?: ReactNode;
  readonly className?: string;
}

/**
 * A single figure across the full width — the one number a screen is about.
 *
 * Distinct from `Stat`: a stat sits in a grid of peers, a banner has no peers.
 */
export function DataBanner({
  label,
  value,
  icon,
  tone = 'sky',
  action,
  className,
}: DataBannerProps) {
  const toneClass = {
    neutral: 'border-line-2 bg-paper-2',
    sky: 'border-sky-edge bg-sky-soft',
    success: 'border-success-border bg-success-soft',
    caution: 'border-caution-border bg-caution-soft',
  }[tone];

  return (
    <div
      className={cn('flex items-center gap-4 rounded-blade border px-5 py-4', toneClass, className)}
    >
      <Show when={icon !== undefined}>
        <KoboyoIcon name={icon ?? 'info'} size={26} className="shrink-0 text-ink-2" />
      </Show>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-extrabold uppercase tracking-overline text-ink-3">{label}</p>
        <div className="mt-[2px]">{value}</div>
      </div>
      <Show when={action !== undefined}>
        <div className="shrink-0">{action}</div>
      </Show>
    </div>
  );
}

/* ---------- Timeline ---------- */

export interface TimelineEntry {
  readonly id: string;
  readonly title: ReactNode;
  readonly when: string;
  readonly body?: ReactNode;
  readonly icon?: KoboyoIconName;
  readonly tone?: 'neutral' | 'success' | 'caution' | 'critical' | 'ai';
}

export interface TimelineProps {
  readonly entries: readonly TimelineEntry[];
  readonly className?: string;
}

/**
 * What happened, in order.
 *
 * The rule runs behind the marks rather than between them, so a timeline reads
 * as one thread — a gap between segments makes each entry look unrelated to
 * the next.
 */
/** Visual spec: design-system/projects/kinnijije-v2/preview/102-timeline.html */
export function Timeline({ entries, className }: TimelineProps) {
  const dot = {
    neutral: 'border-line-2 bg-white text-ink-3',
    success: 'border-success-border bg-success-soft text-success-onsoft',
    caution: 'border-caution-border bg-caution-soft text-caution-onsoft',
    critical: 'border-critical-border bg-critical-soft text-critical-onsoft',
    ai: 'border-grape-border bg-grape-soft text-grape-onsoft',
  };

  return (
    <ol className={cn('relative flex flex-col gap-5', className)}>
      {/* One continuous rule behind every mark. */}
      <span aria-hidden="true" className="absolute bottom-3 left-[15px] top-3 w-px bg-line" />

      <Repeat each={[...entries]}>
        {(entry: TimelineEntry) => (
          <li key={entry.id} className="relative flex gap-4">
            <span
              className={cn(
                'z-base grid h-8 w-8 shrink-0 place-items-center rounded-round border-bold',
                dot[entry.tone ?? 'neutral'],
              )}
            >
              <KoboyoIcon name={entry.icon ?? 'badgeDot'} size={14} />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="min-w-0 font-semibold text-ink">{entry.title}</span>
                <span className="shrink-0 font-mono text-xs text-ink-3">{entry.when}</span>
              </div>
              <Show when={entry.body !== undefined}>
                <div className="mt-1 text-sm text-ink-2">{entry.body}</div>
              </Show>
            </div>
          </li>
        )}
      </Repeat>
    </ol>
  );
}

/* ---------- Progress with content ---------- */

export interface ProgressContentProps {
  readonly value: number;
  readonly title: string;
  readonly detail?: string;
  readonly action?: ReactNode;
  readonly tone?: 'sky' | 'success' | 'caution' | 'critical' | 'ai';
  readonly className?: string;
}

/**
 * A bar with its own explanation.
 *
 * A percentage alone answers "how far" but never "how far through what" — this
 * carries both, which is what a long-running job needs.
 */
export function ProgressContent({
  value,
  title,
  detail,
  action,
  tone = 'sky',
  className,
}: ProgressContentProps) {
  return (
    <div className={cn('rounded-blade border border-line-2 bg-white p-4', className)}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate font-semibold text-ink">{title}</span>
        <span className="shrink-0 font-mono text-sm tnum text-ink-3">{Math.round(value)}%</span>
      </div>
      <Progress value={value} tone={tone} />
      <Show when={detail !== undefined}>
        <p className="mt-2 text-sm text-ink-2">{detail}</p>
      </Show>
      <Show when={action !== undefined}>
        <div className="mt-3">{action}</div>
      </Show>
    </div>
  );
}

/** A progress card whose value has not arrived. Same box, same rhythm. */
export function ProgressContentSkeleton({ className }: { readonly className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('rounded-blade border border-line-2 bg-white p-4', className)}
    >
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="block h-[14px] w-32 animate-shimmer rounded-[3px] bg-skeleton" />
        <span className="block h-[13px] w-9 animate-shimmer rounded-[3px] bg-skeleton" />
      </div>
      <span className="block h-2 w-full animate-shimmer rounded-pill bg-skeleton" />
    </div>
  );
}
