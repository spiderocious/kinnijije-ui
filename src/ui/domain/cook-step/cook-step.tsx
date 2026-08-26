import { KoboyoIcon } from '@icons';
import { cn } from '@shared/utils/cn';
import { Button } from '@ui/primitives/button/button';

/**
 * The cook-mode step, sized for the real reading distance.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/262-cook-step.html
 *
 * **The single largest type in the product.** A cook is two feet away with wet
 * hands, so the step body is 21–26px and the step number is unmissable. That is
 * a reading-distance decision, not a style one — shrinking it to match the rest
 * of the system would break the only screen used at arm's length.
 *
 * The step index is DERIVED from position, never stored — a stored index drifts
 * the moment a step is inserted.
 */

export interface CookStepProps {
  /** 1-indexed, derived from position. */
  readonly index: number;
  readonly total: number;
  /** A short imperative — "Fry the base". */
  readonly title: string;
  readonly body: string;
  /** Minutes, if this step has a timer. */
  readonly timerMinutes?: number;
  readonly onStartTimer?: () => void;
  /** Cook mode runs on an ink ground. */
  readonly onDark?: boolean;
  readonly className?: string;
}

export function CookStep({
  index,
  total,
  title,
  body,
  timerMinutes,
  onStartTimer,
  onDark = true,
  className,
}: CookStepProps) {
  return (
    <article
      className={cn(
        'flex flex-col gap-4 rounded-blade-xl border-bold p-6',
        onDark ? 'border-ink bg-ink text-ink-inv' : 'border-ink bg-white text-ink shadow-drop',
        className,
      )}
    >
      <p
        className={cn(
          'font-mono text-sm font-bold tnum uppercase tracking-[0.08em]',
          onDark ? 'text-sky-300' : 'text-ink-3',
        )}
      >
        Step {index} of {total}
      </p>

      <h2 className="font-display text-3xl font-extrabold leading-none tracking-display">
        {title}
      </h2>

      {/* 21-26px — the reading-distance decision. */}
      <p className={cn('text-[23px] leading-snug', onDark ? 'text-ink-inv/90' : 'text-ink-2')}>
        {body}
      </p>

      {timerMinutes !== undefined && (
        <Button
          size="lg"
          onDark={onDark}
          variant="secondary"
          icon="kitchenTimer"
          onClick={onStartTimer}
          className="self-start"
        >
          Start the {timerMinutes}-minute timer
        </Button>
      )}
    </article>
  );
}

/** Loading, at the real measure — not a small skeleton scaled up. */
export function CookStepSkeleton({ onDark = true }: { readonly onDark?: boolean }) {
  const bar = onDark ? 'bg-white/10' : 'bg-paper-2';
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex flex-col gap-4 rounded-blade-xl border-bold p-6',
        onDark ? 'border-ink bg-ink' : 'border-line-2 bg-white',
      )}
    >
      <div className={cn('h-[18px] w-[110px] animate-shimmer rounded-[4px]', bar)} />
      <div className={cn('h-[38px] w-3/5 animate-shimmer rounded-[6px]', bar)} />
      <div className="flex flex-col gap-2">
        <div className={cn('h-[24px] animate-shimmer rounded-[4px]', bar)} />
        <div className={cn('h-[24px] w-4/5 animate-shimmer rounded-[4px]', bar)} />
      </div>
    </div>
  );
}

export interface CookStepErrorProps {
  /** The step the cook was on. Their place is kept. */
  readonly lastStep: number;
  readonly onRetry?: () => void;
}

/** Failed mid-cook — the step you were on is kept. */
export function CookStepError({ lastStep, onRetry }: CookStepErrorProps) {
  return (
    <article className="flex flex-col items-start gap-4 rounded-blade-xl border-bold border-ink bg-ink p-6 text-ink-inv">
      <KoboyoIcon name="offlineScreen" size={44} className="text-critical" alone />
      <h2 className="font-display text-2xl font-extrabold tracking-display">
        Lost the connection
      </h2>
      <p className="text-md text-ink-inv/80">
        Your place is saved. Reconnect to see the rest.
      </p>
      <Button onDark variant="secondary" size="lg" icon="cycle" onClick={onRetry}>
        Try again
      </Button>
      <p className="font-mono text-sm text-sky-300">
        You were on step {lastStep}. We kept your place.
      </p>
    </article>
  );
}
