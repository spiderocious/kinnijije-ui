import { Repeat } from 'meemaw';

import { cn } from '@shared/utils/cn';
import { Button } from '@ui/primitives';

/**
 * The stepped-flow footer.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/35-continue-bar.html
 *
 * Back, progress and next as ONE component, so the step count cannot drift from
 * the buttons — the failure mode this exists to prevent is a flow whose dots say
 * 3-of-5 while the button says "Finish".
 */

export interface ContinueBarProps {
  /** 1-indexed. */
  readonly step: number;
  readonly totalSteps: number;
  readonly onBack?: () => void;
  readonly onNext?: () => void;
  readonly nextLabel?: string;
  readonly backLabel?: string;
  readonly loading?: boolean;
  /** The next step is not yet reachable. */
  readonly nextDisabled?: boolean;
  readonly className?: string;
}

export function ContinueBar({
  step,
  totalSteps,
  onBack,
  onNext,
  nextLabel,
  backLabel = 'Back',
  loading = false,
  nextDisabled = false,
  className,
}: ContinueBarProps) {
  const isLast = step >= totalSteps;
  const isFirst = step <= 1;
  const dots = Array.from({ length: totalSteps }, (_, index) => index + 1);

  return (
    <div
      className={cn(
        'sticky bottom-0 z-sticky flex items-center gap-4 border-t border-ink bg-paper',
        'px-4 pb-[max(var(--s-4),env(safe-area-inset-bottom))] pt-4',
        className,
      )}
    >
      <Button variant="secondary" onClick={onBack} disabled={isFirst} icon="arrowRight"
        className="[&>svg]:rotate-180">
        {backLabel}
      </Button>

      {/* Progress and buttons live together so they cannot disagree. */}
      <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
        <div className="flex items-center gap-[6px]" aria-hidden="true">
          <Repeat each={dots}>
            {(dot: number) => (
              <span
                key={dot}
                className={cn(
                  'h-[6px] rounded-pill transition-all duration-fast ease-kj',
                  dot === step ? 'w-5 bg-sky' : 'w-[6px]',
                  dot < step && 'bg-sky-300',
                  dot > step && 'bg-line-2',
                )}
              />
            )}
          </Repeat>
        </div>
        <p className="font-mono text-xs tnum text-ink-3">
          <span className="sr-only">Step </span>
          {step} of {totalSteps}
        </p>
      </div>

      <Button onClick={onNext} loading={loading} disabled={nextDisabled} iconEnd="arrowRight">
        {nextLabel ?? (isLast ? 'Finish' : 'Continue')}
      </Button>
    </div>
  );
}
