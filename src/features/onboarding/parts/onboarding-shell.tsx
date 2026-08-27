import type { ReactNode } from 'react';

import { KoboyoIcon } from '@icons';
import { StepProgress } from '@ui/feedback';
import { Button } from '@ui/primitives';

interface OnboardingShellProps {
  readonly step: number;
  readonly total: number;
  readonly children: ReactNode;
  readonly onBack?: () => void;
  readonly onNext: () => void;
  readonly nextLabel: string;
  readonly nextLoading?: boolean;
  readonly nextDisabled?: boolean;
  /** Rendered beside the primary action — a skip, usually. */
  readonly secondary?: ReactNode;
}

/**
 * The frame every onboarding step shares.
 *
 * Modelled on cook mode — a fixed progress header, one thing at a time, and a
 * pinned action bar — but on the light ground rather than cook mode's dark
 * takeover. Cook mode is dark because a propped phone across a kitchen needs
 * contrast; this is a person sitting with their phone, so it stays in the
 * ordinary register.
 *
 * The action bar is pinned so the primary action is reachable with a thumb on
 * a phone, and the body scrolls under it rather than pushing it off-screen.
 */
export function OnboardingShell({
  step,
  total,
  children,
  onBack,
  onNext,
  nextLabel,
  nextLoading = false,
  nextDisabled = false,
  secondary,
}: OnboardingShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-ground">
      <header className="sticky top-0 z-10 border-b border-line bg-ground/95 px-5 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-[560px] items-center gap-3">
          <KoboyoIcon name="cookingPot" size={24} className="shrink-0 text-sky" alone />
          <StepProgress current={step} total={total} className="flex-1" />
        </div>
      </header>

      <main className="flex-1 px-5 py-7 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-[560px]">{children}</div>
      </main>

      <footer className="sticky bottom-0 border-t border-line bg-ground/95 px-5 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-[560px] items-center gap-3">
          {onBack !== undefined ? (
            <Button variant="secondary" size="lg" onClick={onBack}>
              Back
            </Button>
          ) : null}

          {secondary}

          <Button
            size="lg"
            className="flex-1"
            onClick={onNext}
            loading={nextLoading}
            disabled={nextDisabled}
          >
            {nextLabel}
          </Button>
        </div>
      </footer>
    </div>
  );
}
