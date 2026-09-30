import { ArrowLeft } from 'lucide-react';

import { Button } from '@ui/primitives';

/**
 * Back and Continue, side by side at the bottom.
 *
 * Both at the thumb, because the flow is walked on a phone and a Back button
 * only at the top of the screen means reaching for it every time. The browser's
 * own Back also works (the step is in the URL), so this is the visible
 * affordance for the same thing rather than the only way to do it.
 *
 * Continue takes the remaining width and Back stays compact: they are not
 * equal choices, and giving them equal weight would make every step read as a
 * fork in the road.
 */
interface StepNavProps {
  readonly onBack: () => void;
  readonly onContinue: () => void;
  readonly continueLabel: string;
  readonly continueDisabled?: boolean;
  readonly loading?: boolean;
  /** A second, quieter action under the pair. */
  readonly secondary?: { label: string; onClick: () => void } | undefined;
  readonly backLabel?: string;
}

export function StepNav({
  onBack,
  onContinue,
  continueLabel,
  continueDisabled = false,
  loading = false,
  secondary,
  backLabel = 'Back',
}: StepNavProps) {
  return (
    <>
      <div className="flex items-stretch gap-2">
        <Button
          variant="secondary"
          onClick={onBack}
          aria-label={backLabel}
          className="shrink-0 px-5"
        >
          <ArrowLeft size={18} strokeWidth={2.6} />
          <span className="sr-only sm:not-sr-only sm:ml-1.5">{backLabel}</span>
        </Button>

        <Button
          fullWidth
          loading={loading}
          disabled={continueDisabled}
          onClick={onContinue}
        >
          {continueLabel}
        </Button>
      </div>

      {secondary !== undefined && (
        <Button fullWidth variant="tertiary" onClick={secondary.onClick} disabled={loading}>
          {secondary.label}
        </Button>
      )}
    </>
  );
}
