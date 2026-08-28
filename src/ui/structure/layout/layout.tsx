import { useRef, type ElementType, type ReactNode } from 'react';
import { Repeat, Show } from 'meemaw';

import { ChevronLeft, ChevronRight, KoboyoIcon, Loader2, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';

/**
 * The layout and container primitives.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/198-list-container.html
 *                                                          199-listbox.html
 *                                                          201-tile.html
 *                                                          202-divider.html
 *                                                          203-carousel.html
 *                                                          205-prompt-hero.html
 */

/* ---------- Divider ---------- */

export interface DividerProps {
  readonly orientation?: 'horizontal' | 'vertical';
  /** A word in the middle — "or", "then". */
  readonly label?: string;
  readonly className?: string;
}

/**
 * A rule.
 *
 * The labelled variant is the reason this is a component: centring a word in a
 * line is fiddly enough that everyone does it slightly differently, and the
 * difference is visible when two appear on one screen.
 */
/** Visual spec: design-system/projects/kinnijije-v2/preview/202-divider.html */
export function Divider({ orientation = 'horizontal', label, className }: DividerProps) {
  if (orientation === 'vertical') {
    return <span role="separator" aria-orientation="vertical" className={cn('w-px self-stretch bg-line', className)} />;
  }

  if (label === undefined) {
    return <hr className={cn('border-0 border-t border-line', className)} />;
  }

  return (
    <div role="separator" className={cn('flex items-center gap-3', className)}>
      <span className="h-px flex-1 bg-line" />
      <span className="text-xs font-extrabold uppercase tracking-overline text-ink-3">{label}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

/* ---------- List container ---------- */

export interface ListContainerProps {
  readonly children: ReactNode;
  /** `divided` for rows, `spaced` for cards. */
  readonly variant?: 'divided' | 'spaced' | 'plain';
  readonly as?: ElementType;
  readonly label?: string;
  readonly className?: string;
}

/**
 * The frame a run of rows or cards sits in.
 *
 * `divided` puts a hairline between rows; `spaced` gaps cards apart. Mixing
 * the two — a border AND a gap — is the single most common way a list ends up
 * looking twice as busy as it is.
 */
export function ListContainer({
  children,
  variant = 'divided',
  as: Component = 'ul',
  label,
  className,
}: ListContainerProps) {
  return (
    <Component
      aria-label={label}
      className={cn(
        variant === 'divided' && 'divide-y divide-line',
        variant === 'spaced' && 'flex flex-col gap-3',
        className,
      )}
    >
      {children}
    </Component>
  );
}

/**
 * The list's own states.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/198-list-container.html
 *
 * These are companions rather than props on `ListContainer`, because a list that
 * takes `error`/`skeleton`/`stale` flags ends up branching four ways inside a
 * component whose whole job is to space its children. The caller picks one.
 *
 * **`loading` and `skeleton` are different states here.** The skeleton is a
 * first load with nothing to show; `loading` is appending a page, and existing
 * rows stay put while it runs — replacing a populated list with skeletons on
 * pagination is how a user loses their scroll position.
 */
export function ListSkeleton({
  rows = 4,
  height = 64,
  className,
}: {
  readonly rows?: number;
  readonly height?: number;
  readonly className?: string;
}) {
  // Varied widths: a stack of identical bars reads as a pattern, not as content.
  const widths = ['92%', '78%', '86%', '70%', '88%'];
  return (
    <div aria-hidden="true" className={cn('divide-y divide-line', className)}>
      <Repeat each={Array.from({ length: rows }, (_, i) => i)}>
        {(i: number) => (
          <div key={i} className="flex items-center gap-3 px-1" style={{ height }}>
            <span className="h-9 w-9 shrink-0 animate-shimmer rounded-blade-xs bg-skeleton" />
            <span
              className="h-[14px] animate-shimmer rounded-[3px] bg-skeleton"
              style={{ width: widths[i % widths.length] }}
            />
          </div>
        )}
      </Repeat>
    </div>
  );
}

/** Appending a page. Existing rows stay — this sits beneath them. */
export function ListAppending({ className }: { readonly className?: string }) {
  return (
    <div
      className={cn('flex items-center justify-center gap-2 py-4 text-sm text-ink-3', className)}
    >
      <Loader2 size={15} className="animate-spin" />
      Loading more
    </div>
  );
}

/** Cached rows. The list is real, its age is not hidden. */
export function ListStaleNote({
  age,
  onRefresh,
  className,
}: {
  readonly age: string;
  readonly onRefresh?: () => void;
  readonly className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-b border-line bg-paper-2 px-3 py-2',
        className,
      )}
    >
      <span className="text-xs text-ink-3">Showing cached results from {age}</span>
      <Show when={onRefresh !== undefined}>
        <button
          type="button"
          onClick={onRefresh}
          className="text-xs font-extrabold text-sky hover:underline"
        >
          Refresh
        </button>
      </Show>
    </div>
  );
}

/* ---------- Listbox ---------- */

export interface ListboxOption {
  readonly value: string;
  readonly label: string;
  readonly detail?: string;
  readonly icon?: KoboyoIconName;
  readonly disabled?: boolean;
}

export interface ListboxProps {
  readonly options: readonly ListboxOption[];
  readonly value: string | undefined;
  readonly onValueChange: (value: string) => void;
  readonly label: string;
  readonly className?: string;
}

/**
 * A list you pick from, in place.
 *
 * Unlike `Select`, this does not open — it is already showing every option,
 * which is right when the choice IS the screen rather than one field on it.
 */
/** Visual spec: design-system/projects/kinnijije-v2/preview/199-listbox.html */
export function Listbox({ options, value, onValueChange, label, className }: ListboxProps) {
  return (
    <ul
      role="listbox"
      aria-label={label}
      className={cn('overflow-hidden rounded-blade border border-line-2 bg-white', className)}
    >
      <Repeat each={[...options]}>
        {(option: ListboxOption) => {
          const selected = option.value === value;
          return (
            <li key={option.value} className="border-b border-line last:border-b-0">
              <button
                type="button"
                role="option"
                aria-selected={selected}
                disabled={option.disabled}
                onClick={() => onValueChange(option.value)}
                className={cn(
                  'flex w-full items-center gap-3 px-pad py-row-y text-left transition-colors duration-fast',
                  'focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_3px_var(--sky-glow)]',
                  'disabled:opacity-[0.42] disabled:cursor-not-allowed',
                  selected ? 'bg-sky-soft' : 'hover:bg-paper-2',
                )}
              >
                <Show when={option.icon !== undefined}>
                  <KoboyoIcon name={option.icon ?? 'info'} size={18} className="shrink-0 text-ink-3" />
                </Show>
                <span className="min-w-0 flex-1">
                  <span className={cn('block truncate text-ctrl', selected ? 'font-extrabold text-sky-on' : 'text-ink')}>
                    {option.label}
                  </span>
                  <Show when={option.detail !== undefined}>
                    <span className="block truncate text-xs text-ink-3">{option.detail}</span>
                  </Show>
                </span>
                <Show when={selected}>
                  <KoboyoIcon name="tick" size={16} className="shrink-0 text-sky-on" />
                </Show>
              </button>
            </li>
          );
        }}
      </Repeat>
    </ul>
  );
}

/* ---------- Tile ---------- */

export interface TileProps {
  readonly title: string;
  readonly body?: string;
  readonly icon?: KoboyoIconName;
  readonly onPress?: () => void;
  /** A count or status in the corner. */
  readonly meta?: ReactNode;
  readonly tone?: 'default' | 'sky' | 'success' | 'caution';
  readonly className?: string;
}

/**
 * A square-ish pressable block.
 *
 * Distinct from `Card`: a tile is one idea and always pressable, where a card
 * holds several and may just sit there.
 */
/** Visual spec: design-system/projects/kinnijije-v2/preview/201-tile.html */
export function Tile({ title, body, icon, onPress, meta, tone = 'default', className }: TileProps) {
  const toneClass = {
    default: 'border-line-2 bg-white hover:border-sky-edge hover:bg-sky-soft',
    sky: 'border-sky-edge bg-sky-soft hover:bg-sky-200',
    success: 'border-success-border bg-success-soft',
    caution: 'border-caution-border bg-caution-soft',
  }[tone];

  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <Show when={icon !== undefined}>
          <KoboyoIcon name={icon ?? 'info'} size={26} className="text-ink-2" />
        </Show>
        <Show when={meta !== undefined}>
          <span className="ml-auto shrink-0">{meta}</span>
        </Show>
      </div>
      <div className="mt-auto pt-3">
        <p className="font-display text-md font-extrabold tracking-display">{title}</p>
        <Show when={body !== undefined}>
          <p className="mt-1 text-sm text-ink-2">{body}</p>
        </Show>
      </div>
    </>
  );

  const classes = cn(
    'flex min-h-[128px] flex-col rounded-blade border p-4 text-left transition-colors duration-fast',
    toneClass,
    className,
  );

  if (onPress === undefined) return <div className={classes}>{inner}</div>;

  return (
    <button
      type="button"
      onClick={onPress}
      className={cn(classes, 'focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]')}
    >
      {inner}
    </button>
  );
}

/* ---------- Carousel ---------- */

export interface CarouselProps {
  readonly label: string;
  readonly children: ReactNode;
  readonly className?: string;
}

/**
 * A horizontal scroller with real scroll-snap.
 *
 * **Scrolls natively rather than transforming a track.** A transformed carousel
 * loses touch momentum, keyboard scrolling and the scrollbar — all of which a
 * user already knows how to use. The arrows are an addition for pointer users,
 * not the mechanism.
 */
/** Visual spec: design-system/projects/kinnijije-v2/preview/203-carousel.html */
export function Carousel({ label, children, className }: CarouselProps) {
  const scroller = useRef<HTMLDivElement>(null);

  function scrollBy(direction: -1 | 1) {
    const node = scroller.current;
    if (node === null) return;
    node.scrollBy({ left: direction * (node.clientWidth * 0.8), behavior: 'smooth' });
  }

  return (
    <div className={cn('relative', className)}>
      <div
        ref={scroller}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:thin] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]"
      >
        {children}
      </div>

      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollBy(-1)}
          className="grid h-8 w-8 place-items-center rounded-round border border-ink bg-white text-ink transition-colors hover:bg-paper-2"
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollBy(1)}
          className="grid h-8 w-8 place-items-center rounded-round border border-ink bg-white text-ink transition-colors hover:bg-paper-2"
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

/* ---------- Prompt hero ---------- */

export interface PromptHeroProps {
  readonly title: string;
  readonly body?: string;
  readonly icon?: KoboyoIconName;
  readonly action?: ReactNode;
  readonly className?: string;
}

/**
 * The block that asks for the one thing a screen needs.
 *
 * Distinct from an empty state: an empty state reports that there is nothing,
 * this one asks for something. The difference matters because an empty state
 * that reads as a prompt makes a user think they did something wrong.
 */
/** Visual spec: design-system/projects/kinnijije-v2/preview/205-prompt-hero.html */
export function PromptHero({ title, body, icon, action, className }: PromptHeroProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-blade-lg border-bold border-ink bg-sky-soft px-6 py-8 text-center shadow-drop',
        className,
      )}
    >
      <Show when={icon !== undefined}>
        <span className="grid h-14 w-14 place-items-center rounded-blade-sm bg-white text-sky-on">
          <KoboyoIcon name={icon ?? 'cookingPot'} size={28} />
        </span>
      </Show>
      <h2 className="font-display text-xl font-extrabold tracking-display">{title}</h2>
      <Show when={body !== undefined}>
        <p className="max-w-[46ch] text-md text-ink-2">{body}</p>
      </Show>
      <Show when={action !== undefined}>
        <div className="mt-2">{action}</div>
      </Show>
    </div>
  );
}
