import { useEffect, useState } from 'react';

import { Show } from 'meemaw';

import { useStepParam } from '@shared/hooks/use-step-param';

import { Button } from '@ui/primitives';

import { EXPLAINER_SLIDES } from '../content/onboarding.content';
import {
  useCompleteOnboarding,
  useOnboardingState,
  useSaveOnboarding,
} from '../hooks/use-onboarding';
import { ExplainerStep } from '../parts/explainer-step';
import { OnboardingShell } from '../parts/onboarding-shell';
import { TasteStep } from '../parts/taste-step';

/** Three explainer slides, then taste, then the kitchen. */
const EXPLAINER_COUNT = EXPLAINER_SLIDES.length;
const TASTE_STEP = EXPLAINER_COUNT + 1;
/**
 * Onboarding ENDS on taste.
 *
 * There used to be a kitchen step here asking for ingredients before anybody
 * had seen what the product does with them. Filling a kitchen belongs on the
 * Stock page, where it can be done by photo or receipt and revisited — not as
 * a toll gate on the way in.
 */
const TOTAL_STEPS = TASTE_STEP;

export default function OnboardingScreen() {
  const { data: state, isLoading } = useOnboardingState();
  const save = useSaveOnboarding();
  const complete = useCompleteOnboarding();

  /**
   * The step lives in the URL, so BACK walks back through onboarding rather
   * than dropping the person out of it, and a refresh keeps their place.
   */
  // Only the steps that exist. Leaving a spare value in here let somebody
  // reach `?step=5` by hand and land on a screen that renders nothing.
  const STEP_VALUES = ['1', '2', '3', '4'] as const;
  const { stage, go } = useStepParam<(typeof STEP_VALUES)[number]>({
    key: 'step',
    stages: STEP_VALUES,
  });
  const step = Number(stage);
  const setStep = (next: number): void => {
    go(String(Math.max(1, Math.min(TOTAL_STEPS, next))) as (typeof STEP_VALUES)[number]);
  };

  // Local drafts, seeded from the server once it answers. Editing straight
  // against the query cache would fire a save on every keystroke.
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'anything'>('anything');
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    // Seed once. Re-seeding on every response would overwrite what the person
    // is in the middle of typing each time a save resolves.
    if (state === undefined || seeded) return;
    setCuisines(state.cuisines);
    setDifficulty(state.difficulty);
    setSeeded(true);
  }, [state, seeded]);

  const toggleCuisine = (cuisine: string) => {
    setCuisines((current) =>
      current.includes(cuisine) ? current.filter((c) => c !== cuisine) : [...current, cuisine],
    );
  };

  const goBack = () => {
    // Real history, so this and the browser back button agree.
    window.history.back();
  };

  const advance = () => {
    setStep(step + 1);
  };

  /**
   * The last step: save what they picked, then mark onboarding done.
   *
   * In sequence, not in parallel — completing first would let a failed save
   * leave somebody onboarded with no preferences stored.
   */
  const finish = () => {
    save.mutate(
      { cuisines, difficulty },
      {
        onSuccess: () => {
          complete.mutate();
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-ground p-5">
        <div className="flex w-full max-w-[560px] flex-col items-center gap-4">
          <div aria-hidden="true" className="h-16 w-16 animate-shimmer rounded-blade bg-skeleton" />
          <div aria-hidden="true" className="h-8 w-2/3 animate-shimmer rounded bg-skeleton" />
          <div aria-hidden="true" className="h-20 w-full animate-shimmer rounded-blade bg-skeleton" />
        </div>
      </div>
    );
  }

  const isExplainer = step <= EXPLAINER_COUNT;
  const slide = EXPLAINER_SLIDES[step - 1];

  return (
    <OnboardingShell
      step={step}
      total={TOTAL_STEPS}
      {...(step > 1 && { onBack: goBack })}
      onNext={step === TASTE_STEP ? finish : advance}
      nextLabel={step === TASTE_STEP ? 'Open my kitchen' : 'Continue'}
      nextLoading={save.isPending || complete.isPending}
      // Nothing here is required. The defaults are a real answer.
      nextDisabled={false}
      secondary={
        <Show when={step === TASTE_STEP}>
          {/* Skipping still completes onboarding — it just keeps the
              defaults, which the suggestions already read. */}
          <Button variant="tertiary" size="lg" onClick={finish}>
            Skip
          </Button>
        </Show>
      }
    >
      <Show when={isExplainer && slide !== undefined}>
        <ExplainerStep
          slide={slide ?? EXPLAINER_SLIDES[0]!}
          showProvenance={step === EXPLAINER_COUNT}
        />
      </Show>

      <Show when={step === TASTE_STEP}>
        <TasteStep
          availableCuisines={state?.available_cuisines ?? []}
          selectedCuisines={cuisines}
          onToggleCuisine={toggleCuisine}
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
        />
      </Show>
    </OnboardingShell>
  );
}
