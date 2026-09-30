import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from '@tanstack/react-router';

import { EVENTS, analytics } from '@shared/services/analytics';
import { ROUTES } from '@shared/constants/routes';
import { Button } from '@ui/primitives';

import { DECIDE_COPY } from '../content/decide.content';
import { useDecide, useDecideOptions, usePrefetchDecideOptions } from '../hooks/use-decide';
import { DecideHero } from './parts/decide-hero';
import { DecideThinking } from './parts/decide-thinking';
import { VerdictStories } from './parts/verdict-stories';
import { StepKitchen } from './parts/step-kitchen';
import { StepMood } from './parts/step-mood';
import { StepTime } from './parts/step-time';
import { StepWeight } from './parts/step-weight';
import { DECIDE_STAGES } from '../types/decide.types';
import type { DecideStage, Mood, TimeBudget, Weight } from '../types/decide.types';

/**
 * The front door.
 *
 * The step lives in the URL (`?step=mood`), not in component state, so the
 * browser's own Back button walks back through the questions instead of
 * leaving the flow. Each step is a real history entry; the draft persists
 * separately, so going back never loses an answer.
 */

export default function DecideScreen() {
  const navigate = useNavigate();
  // Warmed the moment somebody lands, so the kitchen screen two taps later
  // paints from memory instead of waiting on the network.
  usePrefetchDecideOptions();
  const { data: options } = useDecideOptions();
  const decide = useDecide();
  const location = useLocation();

  const search = location.search as { step?: DecideStage };
  const stage: DecideStage = search.step ?? 'hero';

  /**
   * When the current step was reached, for `ms_on_step`.
   *
   * A ref rather than state: it must not cause a render, and it is read only
   * at the moment the step changes. A step people sit on is a step they do not
   * understand — which is not visible in a drop-off rate alone.
   */
  const stageEnteredAt = useRef(Date.now());
  /** True until the first step change, so `decide_started` fires exactly once. */
  const startedRef = useRef(false);

  /**
   * Moving between steps is a NAVIGATION, so Back is the browser's own Back.
   *
   * `replace` is passed when correcting the URL to a step the person did not
   * choose, so a correction never becomes a history entry they must press Back
   * through twice.
   */
  const setStage = useCallback(
    (next: DecideStage, replace = false) => {
      // Leaving the hero is the honest top of the funnel: the gap between
      // landing and this is the hero's own failure rate.
      if (!startedRef.current && next !== 'hero') {
        startedRef.current = true;
        analytics.track(EVENTS.DECIDE_STARTED, { entry_stage: next });
      }

      stageEnteredAt.current = Date.now();

      void navigate({
        to: location.pathname,
        search: next === 'hero' ? {} : { step: next },
        replace,
      });
    },
    [navigate, location.pathname],
  );

  /**
   * One event for every answered step, with the step as a property.
   *
   * Deliberately not six separate events: one builds a funnel with a step
   * breakdown and survives the flow being reordered, six must be rebuilt every
   * time a question moves.
   */
  const trackStep = useCallback(
    (step: DecideStage, value: string | number | null, itemCount?: number) => {
      analytics.track(EVENTS.DECIDE_STEP_COMPLETED, {
        step,
        step_index: DECIDE_STAGES.indexOf(step),
        value,
        ...(itemCount !== undefined && { item_count: itemCount }),
        ms_on_step: Date.now() - stageEnteredAt.current,
      });
    },
    [],
  );

  const trackSkip = useCallback((step: DecideStage) => {
    // A skip is a real answer ("I have nothing") but also friction. If most
    // people skip the kitchen, the 400-tile picker is not earning its build.
    analytics.track(EVENTS.DECIDE_STEP_SKIPPED, {
      step,
      step_index: DECIDE_STAGES.indexOf(step),
      ms_on_step: Date.now() - stageEnteredAt.current,
    });
  }, []);

  const [rejectedName, setRejectedName] = useState<string | null>(null);

  /**
   * True from the moment Decide is pressed until an answer or an error lands.
   *
   * `isDeciding` alone is not enough: there is a gap between navigating to the
   * verdict step and the mutation flipping that flag, and during that gap the
   * guard below saw "no verdict, not deciding" and bounced straight back to
   * the time step. That is why every decision appeared to return nothing.
   */
  const [requested, setRequested] = useState(false);

  /**
   * A shared or hand-edited URL can name a step the draft cannot support.
   *
   * `?step=verdict` with nothing decided, or `?step=time` with no mood chosen,
   * would otherwise render an empty screen. Sending them to the furthest step
   * they HAVE answered is better than a dead end, and `replace` keeps the
   * correction out of the back stack.
   */
  useEffect(() => {
    if (
      stage === 'verdict' &&
      decide.verdict === null &&
      !decide.isDeciding &&
      !requested &&
      decide.error === null &&
      decide.retryAfterSeconds === null
    ) {
      setStage(decide.draft.weight !== null ? 'time' : 'hero', true);
      return;
    }
    if (stage === 'time' && decide.draft.weight === null) {
      setStage(decide.draft.mood !== null ? 'weight' : 'kitchen', true);
    }
  }, [
    stage,
    decide.verdict,
    decide.isDeciding,
    decide.error,
    decide.retryAfterSeconds,
    decide.draft.weight,
    decide.draft.mood,
    requested,
    setStage,
  ]);

  const run = useCallback(async () => {
    // Marked BEFORE navigating, so the guard above never sees the gap between
    // the step changing and the request starting.
    setRequested(true);
    setStage('verdict');
    await decide.decide();
  }, [decide, setStage]);

  /**
   * "Cook this" on a specific card.
   *
   * The verdict names the meal but withholds the steps, so signed out this
   * routes to signup holding the draft. The chosen meal is recorded first, so
   * the account lands on the one they picked rather than whatever happened to
   * be the winner.
   */
  const goCook = useCallback(
    (mealId: string) => {
      if (mealId !== '') decide.chooseAlternate(mealId);

      // Intent to cook while still anonymous — the closest thing to the value
      // moment before an account exists.
      analytics.track(EVENTS.DECIDE_COOK_CLICKED, {
        meal_id: mealId,
        is_winner: decide.verdict?.verdict.meal_id === mealId,
      });
      // `source` is what says WHICH pitch converts: wanting to save this meal,
      // or running into the hourly cap. Two different findings.
      analytics.track(EVENTS.DECIDE_SIGNUP_CLICKED, {
        source: 'save_meal',
        meal_id: mealId,
        stage: 'verdict',
      });

      void navigate({ to: ROUTES.REGISTER });
    },
    [decide, navigate],
  );

  const goSignUp = useCallback(() => {
    analytics.track(EVENTS.DECIDE_SIGNUP_CLICKED, {
      source: 'rate_limit',
      stage: 'verdict',
    });
    void navigate({ to: ROUTES.REGISTER });
  }, [navigate]);

  if (stage === 'hero') {
    return (
      <DecideHero
        onStart={() => { setStage('kitchen'); }}
        onSignIn={() => {
          analytics.track(EVENTS.DECIDE_SIGNUP_CLICKED, { source: 'hero_signin', stage: 'hero' });
          void navigate({ to: ROUTES.LOGIN });
        }}
      />
    );
  }

  if (stage === 'kitchen') {
    return (
      <StepKitchen
        options={options}
        selected={decide.draft.kitchenItems}
        onChange={(items) => { decide.patch({ kitchenItems: items, kitchenSkipped: false }); }}
        onContinue={() => {
          trackStep('kitchen', null, decide.draft.kitchenItems.length);
          setStage('mood');
        }}
        onSkip={() => {
          decide.patch({ kitchenItems: [], kitchenSkipped: true });
          trackSkip('kitchen');
          setStage('mood');
        }}
        onBack={() => { setStage('hero'); }}
      />
    );
  }

  if (stage === 'mood') {
    return (
      <StepMood
        options={options}
        value={decide.draft.mood}
        onChange={(mood: Mood) => { decide.patch({ mood }); }}
        onContinue={() => {
          trackStep('mood', decide.draft.mood);
          setStage('weight');
        }}
        onBack={() => { setStage('kitchen'); }}
      />
    );
  }

  if (stage === 'weight') {
    return (
      <StepWeight
        options={options}
        value={decide.draft.weight}
        onChange={(weight: Weight) => { decide.patch({ weight }); }}
        onContinue={() => {
          trackStep('weight', decide.draft.weight);
          setStage('time');
        }}
        onBack={() => { setStage('mood'); }}
      />
    );
  }

  if (stage === 'time') {
    return (
      <StepTime
        options={options}
        minutes={decide.draft.minutes}
        city={decide.draft.city}
        onMinutes={(minutes: TimeBudget) => { decide.patch({ minutes }); }}
        onCity={(city) => { decide.patch({ city }); }}
        onDecide={() => {
          trackStep('time', decide.draft.minutes);
          void run();
        }}
        onSkip={() => {
          trackSkip('time');
          void run();
        }}
        onBack={() => { setStage('weight'); }}
        busy={decide.isDeciding}
      />
    );
  }

  // ── The verdict, and the three things that can happen instead ──────────

  if (decide.isDeciding) {
    return <DecideThinking candidates={null} />;
  }

  // A 429 is not an error screen. The refusal IS the offer, with an honest wait.
  if (decide.retryAfterSeconds !== null) {
    return (
      <Centered
        title={DECIDE_COPY.limited.title}
        body={DECIDE_COPY.limited.body(decide.retryAfterSeconds)}
        tone="caution"
        primary={{ label: DECIDE_COPY.limited.cta, onClick: goSignUp }}
        secondary={{
          label: DECIDE_COPY.limited.wait,
          onClick: () => { decide.reset(); setRequested(false); setStage('hero'); },
        }}
      />
    );
  }

  if (decide.exhausted) {
    return (
      <Centered
        title={DECIDE_COPY.exhausted.title}
        body={DECIDE_COPY.exhausted.body}
        tone="caution"
        primary={{ label: DECIDE_COPY.exhausted.widen, onClick: () => { setStage('time'); } }}
        secondary={{
          label: DECIDE_COPY.exhausted.restart,
          onClick: () => { decide.reset(); setRequested(false); setStage('hero'); },
        }}
      />
    );
  }

  if (decide.error !== null && decide.verdict === null) {
    return (
      <Centered
        title="That did not work"
        body={decide.error}
        tone="critical"
        primary={{ label: 'Try again', onClick: () => { void run(); } }}
        secondary={{ label: 'Start again', onClick: () => { decide.reset(); setRequested(false); setStage('hero'); } }}
      />
    );
  }

  if (decide.verdict === null || decide.verdict.verdict.meal_id === '') {
    return (
      <Centered
        title={DECIDE_COPY.empty.title}
        body={DECIDE_COPY.empty.body}
        tone="neutral"
        primary={{
          label: 'Change an answer',
          onClick: () => {
            analytics.track(EVENTS.DECIDE_ANSWER_CHANGED, { from_stage: 'verdict', to_stage: 'time' });
            setStage('time');
          },
        }}
        secondary={{
          label: 'Start again',
          onClick: () => { decide.reset(); setRequested(false); setStage('hero'); },
        }}
      />
    );
  }

  return (
    <VerdictStories
      verdict={decide.verdict}
      rejectedName={rejectedName}
      onCook={goCook}
      onSignUp={goSignUp}
      onReject={(mealId) => {
        const refused = [decide.verdict?.verdict, ...(decide.verdict?.pool ?? [])].find(
          (m) => m?.meal_id === mealId,
        );
        setRejectedName(refused?.name ?? null);
        decide.reject(mealId);
      }}
      onChangeAnswer={() => { setRejectedName(null); setStage('time'); }}
      onRegenerate={() => { setRejectedName(null); void run(); }}
      onRestart={() => { setRejectedName(null); decide.reset(); setRequested(false); setStage('hero'); }}
    />
  );
}

/** The three dead-ends share a shape, so they share a component. */
function Centered({
  title,
  body,
  tone,
  primary,
  secondary,
}: {
  title: string;
  body: string;
  tone: 'caution' | 'critical' | 'neutral';
  primary: { label: string; onClick: () => void };
  secondary: { label: string; onClick: () => void };
}) {
  const toneClass =
    tone === 'caution'
      ? 'border-caution-border bg-caution-soft text-caution-onsoft'
      : tone === 'critical'
        ? 'border-critical-border bg-critical-soft text-critical-onsoft'
        : 'border-line-2 bg-white text-ink-2';

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col justify-center gap-4 bg-paper px-4">
      <div className={['rounded-blade border-2 p-5 shadow-drop-sm', toneClass].join(' ')}>
        <h1 className="font-display text-xl font-extrabold tracking-display">{title}</h1>
        <p className="mt-2 text-sm">{body}</p>
      </div>
      <div className="flex flex-col gap-2">
        <Button fullWidth size="lg" onClick={primary.onClick}>
          {primary.label}
        </Button>
        <Button fullWidth variant="tertiary" onClick={secondary.onClick}>
          {secondary.label}
        </Button>
      </div>
    </div>
  );
}
