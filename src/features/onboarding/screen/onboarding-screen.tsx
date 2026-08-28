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
import { KitchenStep } from '../parts/kitchen-step';
import { OnboardingShell } from '../parts/onboarding-shell';
import { TasteStep } from '../parts/taste-step';

/** Three explainer slides, then taste, then the kitchen. */
const EXPLAINER_COUNT = EXPLAINER_SLIDES.length;
const TASTE_STEP = EXPLAINER_COUNT + 1;
const KITCHEN_STEP = EXPLAINER_COUNT + 2;
const TOTAL_STEPS = KITCHEN_STEP;

export default function OnboardingScreen() {
  const { data: state, isLoading } = useOnboardingState();
  const save = useSaveOnboarding();
  const complete = useCompleteOnboarding();

  /**
   * The step lives in the URL, so BACK walks back through onboarding rather
   * than dropping the person out of it, and a refresh keeps their place.
   */
  const STEP_VALUES = ['1', '2', '3', '4', '5'] as const;
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
  const [items, setItems] = useState<string[]>([]);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    // Seed once. Re-seeding on every response would overwrite what the person
    // is in the middle of typing each time a save resolves.
    if (state === undefined || seeded) return;
    setCuisines(state.cuisines);
    setDifficulty(state.difficulty);
    setItems(state.kitchen_items);
    setSeeded(true);
  }, [state, seeded]);

  const toggleCuisine = (cuisine: string) => {
    setCuisines((current) =>
      current.includes(cuisine) ? current.filter((c) => c !== cuisine) : [...current, cuisine],
    );
  };

  const addItem = (label: string) => {
    const trimmed = label.trim();
    if (trimmed.length === 0) return;
    setItems((current) =>
      // Case-insensitive, matching what the server does, so the list the person
      // sees is the list that gets stored.
      current.some((item) => item.toLowerCase() === trimmed.toLowerCase())
        ? current
        : [...current, trimmed],
    );
  };

  const removeItem = (label: string) => {
    setItems((current) => current.filter((item) => item !== label));
  };

  const goBack = () => {
    // Real history, so this and the browser back button agree.
    window.history.back();
  };

  const advance = () => {
    setStep(step + 1);
  };

  /** Saves this step's answers, then advances. A failed save keeps you here. */
  const saveAndAdvance = () => {
    if (step === TASTE_STEP) {
      save.mutate({ cuisines, difficulty }, { onSuccess: advance });
      return;
    }
    advance();
  };

  const finish = () => {
    // Saved and completed in sequence rather than in parallel: completing
    // first would let a failed save leave someone onboarded with no kitchen.
    save.mutate(
      { kitchen_items: items },
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
      onNext={step === KITCHEN_STEP ? finish : saveAndAdvance}
      nextLabel={
        step === KITCHEN_STEP
          ? items.length > 0
            ? 'Open my kitchen'
            : 'Skip for now'
          : 'Continue'
      }
      nextLoading={save.isPending || complete.isPending}
      // The kitchen step needs at least one thing, or the first suggestion has
      // nothing to work from.
      // Nothing is required here. Blocking on an empty kitchen made the first
      // thing the product ever asks of somebody a demand, before they have
      // seen what it is for.
      nextDisabled={false}
      secondary={
        <Show when={step === TASTE_STEP}>
          {/* Skippable because the defaults are a real answer, not a blank. */}
          <Button variant="tertiary" size="lg" onClick={advance}>
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

      <Show when={step === KITCHEN_STEP}>
        <KitchenStep items={items} onAdd={addItem} onRemove={removeItem} />
      </Show>
    </OnboardingShell>
  );
}
