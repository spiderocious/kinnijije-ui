import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Show } from 'meemaw';

import { Blob, KoboyoIcon, X } from '@icons';
import { cn } from '@shared/utils/cn';
import { Button } from '@ui/primitives';

/**
 * The celebration ladder — how much ceremony is earned.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/170-success-moment.html
 *                                                          171-takeover-congrats.html
 *                                                          172-celebration-ladder.html
 *
 * **Five rungs, and a component may not be spent above its rung.** Celebration
 * inflation is the fastest way to make a product feel cheap: if saving a
 * setting gets confetti, cooking a first meal has nowhere to go.
 *
 * | Rung | Component            | How often          | Example                     |
 * |------|----------------------|--------------------|-----------------------------|
 * | 1    | nothing              | constant           | a chip added to the basket  |
 * | 2    | Toast                | many per session   | recipe saved                |
 * | 3    | Feedback message     | per form           | preferences updated         |
 * | 4    | SuccessMoment        | weekly             | first meal from a suggestion|
 * | 5    | CongratsTakeover     | ≤4 per lifetime    | onboarding done             |
 *
 * **The test:** if you can imagine a user seeing it twice in a month, it is not
 * a takeover. If they would not notice it missing, it should be rung 1.
 *
 * The rungs are typed so a caller has to name the occasion, which is the point
 * at which someone notices they are reaching too high.
 */

/** Rung 4 occasions. Weekly at most. */
export type Rung4Occasion =
  | 'first-meal-cooked'
  | 'week-completed'
  | 'kitchen-seeded'
  | 'first-recipe-published';

/** Rung 5 occasions. Four per lifetime, total. */
export type Rung5Occasion =
  | 'onboarding-complete'
  | 'tenth-meal-cooked'
  | 'first-anniversary'
  | 'hundredth-meal-cooked';

export interface SuccessMomentProps {
  /** Names the occasion — the moment someone notices they are over-reaching. */
  readonly occasion: Rung4Occasion;
  readonly title: string;
  readonly body?: string;
  readonly actions?: ReactNode;
  readonly className?: string;
}

/**
 * Rung 4. Weekly at most.
 *
 * **Never for a saved setting, a completed form, or a dismissed banner** —
 * those are rungs 2 and 3.
 */
export function SuccessMoment({ occasion, title, body, actions, className }: SuccessMomentProps) {
  return (
    <div
      role="status"
      data-occasion={occasion}
      className={cn(
        'flex flex-col items-center gap-3 rounded-blade-lg border-bold border-ink bg-success-soft px-6 py-8 text-center shadow-drop animate-pop',
        className,
      )}
    >
      <Blob name="chef" size={72} expression="happy" animate="hover" />
      <p className="font-display text-xl font-extrabold tracking-display text-success-onsoft">
        {title}
      </p>
      <Show when={body !== undefined}>
        <p className="max-w-[44ch] text-md text-ink-2">{body}</p>
      </Show>
      <Show when={actions !== undefined}>
        <div className="mt-2 flex flex-wrap justify-center gap-3">{actions}</div>
      </Show>
    </div>
  );
}

export interface CongratsTakeoverProps {
  readonly open: boolean;
  /** REQUIRED and always reachable — a mode with no way out traps the user. */
  readonly onExit: () => void;
  /** Four of these exist. Naming it is the check. */
  readonly occasion: Rung5Occasion;
  readonly title: string;
  readonly body?: string;
  readonly actions?: ReactNode;
}

/**
 * Rung 5. **Four per lifetime, total.**
 *
 * A full takeover with no scrim — there is nothing behind it to see through.
 */
export function CongratsTakeover({
  open,
  onExit,
  occasion,
  title,
  body,
  actions,
}: CongratsTakeoverProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onExit();
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onExit]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      data-occasion={occasion}
      // No scrim — there is nothing behind this to see.
      className="fixed inset-0 z-modal flex flex-col items-center justify-center gap-5 bg-paper px-6 text-center animate-fade"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onExit}
        className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-round text-ink-3 transition-colors hover:bg-paper-2 hover:text-ink"
      >
        <X size={18} strokeWidth={3} />
      </button>

      <Blob name="chef" size={132} expression="love" animate="always" />
      <h2 className="max-w-[18ch] font-display text-4xl font-extrabold leading-tight tracking-display">
        {title}
      </h2>
      <Show when={body !== undefined}>
        <p className="max-w-[44ch] text-lg text-ink-2">{body}</p>
      </Show>

      <div className="mt-3 flex flex-wrap justify-center gap-3">
        {actions ?? (
          <Button size="lg" onClick={onExit}>
            Nice
          </Button>
        )}
      </div>
    </div>,
    document.body,
  );
}

export interface TakeoverProps {
  readonly open: boolean;
  /** REQUIRED and always reachable — a mode with no way out traps the user. */
  readonly onExit: () => void;
  readonly title?: string;
  readonly exitLabel?: string;
  /** Runs on an ink ground — cook mode's register. */
  readonly onDark?: boolean;
  readonly children: ReactNode;
}

/**
 * A full-screen mode.
 *
 * Visual spec: 169-takeover.html
 *
 * **No scrim**: there is nothing behind it. And `onExit` is required and always
 * rendered — cook mode is the reason this exists, and a cook with wet hands who
 * cannot find the way out is stuck with the phone they propped up.
 */
/** Visual spec: design-system/projects/kinnijije-v2/preview/169-takeover.html */
export function Takeover({
  open,
  onExit,
  title,
  exitLabel = 'Exit',
  onDark = false,
  children,
}: TakeoverProps) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={cn(
        'fixed inset-0 z-modal flex flex-col animate-fade',
        onDark ? 'bg-ink text-ink-inv' : 'bg-paper text-ink',
      )}
    >
      <header
        className={cn(
          'flex items-center gap-3 border-b px-4 py-3',
          onDark ? 'border-white/15' : 'border-line',
        )}
      >
        {/* Always reachable. */}
        <button
          type="button"
          onClick={onExit}
          className={cn(
            'flex items-center gap-1 rounded-blade-xs px-3 py-1 text-sm font-extrabold transition-colors',
            onDark ? 'text-ink-inv hover:bg-white/10' : 'text-ink-2 hover:bg-paper-2 hover:text-ink',
          )}
        >
          <KoboyoIcon name="closeCross" size={15} />
          {exitLabel}
        </button>
        <Show when={title !== undefined}>
          <h2 className="min-w-0 flex-1 truncate font-display text-lg font-extrabold tracking-display">
            {title}
          </h2>
        </Show>
      </header>

      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>,
    document.body,
  );
}

/**
 * Inside the takeover, while the recipe loads.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/169-takeover.html
 *
 * **The takeover opens first, then fills.** Cook mode is entered with a
 * deliberate press in a kitchen, often with wet hands — making that press feel
 * unregistered while a fetch runs is how someone presses it three times.
 *
 * The exit control is rendered by `Takeover` itself and stays live throughout:
 * exiting is always possible, including from a failure.
 */
export function TakeoverLoading({ onDark = true }: { readonly onDark?: boolean }) {
  const bg = onDark ? 'bg-white/10' : 'bg-paper-2';
  return (
    <div aria-hidden="true" className="flex flex-col items-center gap-4 px-6 py-16">
      <span className={cn('block h-[22px] w-40 animate-shimmer rounded-[3px]', bg)} />
      <span className={cn('block h-[54px] w-full max-w-[520px] animate-shimmer rounded-blade', bg)} />
      <span className={cn('block h-[54px] w-full max-w-[440px] animate-shimmer rounded-blade', bg)} />
    </div>
  );
}

/**
 * It failed inside the mode.
 *
 * Offers a retry and nothing else — `Takeover`'s own exit is always there, so
 * duplicating it here would give the user two different ways out of one screen.
 */
export function TakeoverError({
  message = 'This recipe could not load',
  onRetry,
  onDark = true,
}: {
  readonly message?: string;
  readonly onRetry?: () => void;
  readonly onDark?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      <p
        className={cn(
          'font-display text-xl font-extrabold tracking-display',
          onDark ? 'text-ink-inv' : 'text-ink',
        )}
      >
        {message}
      </p>
      {onRetry !== undefined && (
        <Button onDark={onDark} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
