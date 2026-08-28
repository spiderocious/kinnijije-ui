import { useState } from 'react';

import { useNavigate, useParams } from '@tanstack/react-router';
import { Repeat, Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { ScreenError } from '@shared/ui-shell/screen-states';
import { AppBar } from '@ui/navigation';
import { Button } from '@ui/primitives';
import { CookStep, StepTimer } from '@ui/domain';

import { useMarkCooked, useMealDetail } from '../hooks/use-meals';
import { useWakeLock } from '../hooks/use-wake-lock';

/**
 * Cook mode.
 *
 * Dark, full-screen, no navigation — a phone propped across a kitchen needs
 * contrast, and leaving must be a decision rather than a stray tap.
 */
export default function CookScreen() {
  const navigate = useNavigate();
  const { mealId } = useParams({ strict: false }) as { mealId: string };
  const [step, setStep] = useState(1);
  const [exiting, setExiting] = useState(false);

  const { data, isLoading, error, refetch } = useMealDetail(mealId);
  const markCooked = useMarkCooked();

  // Held for the whole cook, not just while a timer runs.
  useWakeLock(!isLoading);

  if (!isLoading && (error !== null || data === undefined)) {
    return (
      <div className="min-h-dvh bg-ink px-5 py-8">
        <div className="mx-auto w-full max-w-[720px] rounded-blade bg-white p-5">
          <ScreenError
            error={error}
            what="this recipe"
            onRetry={() => {
              void refetch();
            }}
          />
        </div>
      </div>
    );
  }

  if (isLoading || data === undefined) {
    // Dark, because cook mode is — a light skeleton would flash white at
    // somebody standing over a hob.
    return (
      <div className="min-h-dvh bg-ink p-5">
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5">
          <div aria-hidden="true" className="h-8 w-32 animate-shimmer rounded bg-white/10" />
          <div aria-hidden="true" className="h-40 animate-shimmer rounded-blade bg-white/10" />
          <div aria-hidden="true" className="mx-auto h-28 w-28 animate-shimmer rounded-full bg-white/10" />
        </div>
      </div>
    );
  }

  const steps = data.meal.steps;
  const total = steps.length;
  const current = steps[step - 1];
  const isLast = step === total;

  const finish = (): void => {
    // Marking it cooked is what takes the ingredients out of the kitchen.
    markCooked.mutate(mealId, {
      onSuccess: () => {
        void navigate({ to: ROUTES.KITCHEN });
      },
    });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-ink">
      <AppBar
        title={`Step ${String(step)} / ${String(total)}`}
        onBack={() => {
          setExiting(true);
        }}
        backLabel="Exit"
        onDark
      />

      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 p-5 lg:max-w-[900px]">
        <Show when={current !== undefined}>
          <CookStep
            index={step}
            total={total}
            title={current?.heading ?? ''}
            body={current?.description ?? ''}
            onDark
          />
        </Show>

        <Show when={(current?.est_minutes ?? 0) > 0}>
          <div className="flex justify-center">
            <StepTimer seconds={(current?.est_minutes ?? 0) * 60} onDone={() => undefined} size={120} />
          </div>
        </Show>

        {/* Leaving is deliberate: a confirmation, not a back-swipe. */}
        <Show when={exiting}>
          <div className="rounded-blade border border-white/20 p-4 text-center">
            <p className="text-md text-ink-inv">Leave cooking? Your place is not saved.</p>
            <div className="mt-3 flex justify-center gap-3">
              <Button
                variant="secondary"
                onDark
                onClick={() => {
                  void navigate({ to: ROUTES.MEAL(mealId) });
                }}
              >
                Leave
              </Button>
              <Button
                onDark
                onClick={() => {
                  setExiting(false);
                }}
              >
                Keep cooking
              </Button>
            </div>
          </div>
        </Show>

        <Show when={total > 1}>
          <div className="mt-auto">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-overline text-sky-300">
              Coming up
            </p>
            <ol className="flex flex-col gap-2">
              <Repeat each={steps.slice(step, step + 2)}>
                {(next: (typeof steps)[number]) => (
                  <li key={next.index} className="text-sm text-ink-inv/70">
                    <span className="font-mono text-xs text-sky-300">Step {next.index}</span>
                    <br />
                    {next.heading}
                  </li>
                )}
              </Repeat>
            </ol>
          </div>
        </Show>
      </div>

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-white/15 bg-ink p-4">
        <Button
          variant="secondary"
          onDark
          size="lg"
          disabled={step === 1}
          onClick={() => {
            setStep((s) => Math.max(1, s - 1));
          }}
        >
          Previous
        </Button>

        <Button
          size="lg"
          onDark
          className="flex-1"
          iconEnd={isLast ? undefined : 'arrowRight'}
          loading={markCooked.isPending}
          onClick={() => {
            if (isLast) finish();
            else setStep((s) => Math.min(total, s + 1));
          }}
        >
          {isLast ? 'Done — I cooked this' : 'Next step'}
        </Button>
      </div>
    </div>
  );
}
