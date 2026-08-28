import { useEffect, useState } from 'react';

import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { Repeat, Show } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { ROUTES } from '@shared/constants/routes';
import { searchValue } from '@shared/utils/search-value';
import { cn } from '@shared/utils/cn';
import { ScreenError } from '@shared/ui-shell/screen-states';
import { Callout } from '@ui/feedback';
import { AppBar } from '@ui/navigation';
import { Button, Dock, IconButton } from '@ui/primitives';
import { Card } from '@ui/structure';

import { useGenerateMeal, useMealDetail, useToggleFavourite } from '../hooks/use-meals';
import type { MatchedIngredient } from '../services/meals.api';

const STATE_STYLES: Record<string, string> = {
  enough: 'text-success-onsoft',
  low: 'text-caution-onsoft',
  missing: 'text-critical-onsoft',
  optional_missing: 'text-ink-3',
};

const STATE_LABELS: Record<string, string> = {
  enough: 'have it',
  low: 'might be short',
  missing: 'need it',
  optional_missing: 'optional',
};

export default function MealScreen() {
  const navigate = useNavigate();
  const { mealId } = useParams({ strict: false }) as { mealId: string };
  const search = useSearch({ strict: false }) as { meal?: string };
  const [confirming, setConfirming] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  /**
   * `/meals/generated-meal?meal=Fried%20Yam` — a dish the assistant named but
   * we did not have.
   *
   * We write the recipe, save it, and REPLACE the url with the real id. Replace
   * rather than push, so Back leaves the meal entirely instead of returning to
   * a page whose only job is to regenerate itself.
   */
  const isGenerated = mealId === ROUTES.GENERATED_MEAL_ID;
  const wantedName = searchValue(search.meal);

  const generate = useGenerateMeal();
  const { data, isLoading, error, refetch } = useMealDetail(isGenerated ? null : mealId);
  const toggleFavourite = useToggleFavourite();

  const { mutate: runGenerate } = generate;
  useEffect(() => {
    if (!isGenerated || wantedName.length === 0) return;

    runGenerate(wantedName, {
      onSuccess: (result) => {
        void navigate({ to: ROUTES.MEAL(result.meal_id), replace: true });
      },
      onError: (error) => {
        setGenerateError(error.message);
      },
    });
    // Runs once per name — re-running would write the recipe twice.
  }, [isGenerated, wantedName, runGenerate, navigate]);

  if (isGenerated) {
    return (
      <GeneratingScreen
        name={wantedName}
        error={generateError}
        onBack={() => {
          void navigate({ to: ROUTES.CHAT });
        }}
      />
    );
  }

  // A meal that does not exist is an ERROR, not a slow load. Waiting on
  // `data === undefined` alone meant a bad id sat on the skeleton forever.
  if (!isLoading && (error !== null || data === undefined)) {
    return (
      <div className="min-h-dvh bg-ground">
        <AppBar
          title="Recipe"
          onBack={() => {
            void navigate({ to: ROUTES.SUGGESTIONS });
          }}
          backLabel="Back"
        />
        <div className="mx-auto w-full max-w-[720px] px-5 py-8">
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
    // Shaped like the page it becomes, so nothing jumps when the data lands.
    return (
      <div className="min-h-dvh bg-ground px-5 py-6">
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4">
          <div aria-hidden="true" className="h-14 w-2/3 animate-shimmer rounded-blade bg-skeleton" />
          <div aria-hidden="true" className="h-20 animate-shimmer rounded-blade bg-skeleton" />
          <div aria-hidden="true" className="h-32 animate-shimmer rounded-blade bg-skeleton" />
          <div aria-hidden="true" className="h-48 animate-shimmer rounded-blade bg-skeleton" />
        </div>
      </div>
    );
  }

  const { meal } = data;
  const missingRequired = data.missing.length > 0;

  return (
    <div className="flex min-h-dvh flex-col bg-ground pb-28">
      <AppBar
        title={meal.name}
        onBack={() => {
          void navigate({ to: ROUTES.SUGGESTIONS });
        }}
        backLabel="Back"
        action={
          <IconButton
            icon={data.is_favourite ? 'likeHeart' : 'bookmark'}
            label={data.is_favourite ? 'Remove from favourites' : 'Save to favourites'}
            onClick={() => {
              toggleFavourite.mutate({ mealId, favourite: !data.is_favourite });
            }}
          />
        }
      />

      <div className="mx-auto w-full max-w-[720px] flex-1 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-4">
          <KoboyoIcon name={(meal.hero_icon ?? 'plateFull') as never} size={56} className="text-sky" alone />
          <div>
            <h1 className="font-display text-2xl font-extrabold leading-tight tracking-display sm:text-3xl">
              {meal.name}
            </h1>
            <p className="mt-1 font-mono text-xs text-ink-3">
              {meal.cook_time_minutes} min · serves {meal.serves} · {meal.difficulty}
              {meal.source === 'ai' ? ' · made by AI' : ' · verified'}
            </p>
          </div>
        </div>

        <p className="mt-4 text-md leading-relaxed text-ink-2">{meal.description}</p>

        {/* The thing a recipe database never tells you. */}
        <Card variant="quiet" className="mt-5">
          <p className="text-xs font-extrabold uppercase tracking-overline text-ink-3">
            What makes it good
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink">{meal.what_makes_it_good}</p>
        </Card>

        {/* How it sits against what they have been eating. */}
        <Card variant="quiet" className="mt-4">
          <p className="text-xs font-extrabold uppercase tracking-overline text-ink-3">
            Why this, now
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink">{data.history.why_now}</p>
          <Show when={data.history.times_cooked_recently > 0}>
            <p className="mt-2 text-xs text-ink-3">
              You have cooked this {data.history.times_cooked_recently} time
              {data.history.times_cooked_recently === 1 ? '' : 's'} recently.
            </p>
          </Show>
        </Card>

        <section className="mt-6">
          <h2 className="mb-3 text-xs font-extrabold uppercase tracking-overline text-ink-3">
            What you need
          </h2>
          <ul className="flex flex-col gap-2">
            <Repeat each={data.ingredients}>
              {(ingredient: MatchedIngredient) => (
                <li
                  key={ingredient.name}
                  className="flex items-center justify-between gap-3 rounded-blade-sm border border-line bg-white px-3 py-2"
                >
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">{ingredient.name}</span>
                  <span className="font-mono text-xs text-ink-3">
                    {ingredient.needed !== null
                      ? `${ingredient.needed} ${ingredient.needed_unit ?? ''}`
                      : 'to taste'}
                  </span>
                  <span className={cn('text-xs font-extrabold', STATE_STYLES[ingredient.state])}>
                    {STATE_LABELS[ingredient.state]}
                  </span>
                </li>
              )}
            </Repeat>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="mb-3 text-xs font-extrabold uppercase tracking-overline text-ink-3">
            How to cook it
          </h2>
          <ol className="flex flex-col gap-3">
            <Repeat each={meal.steps}>
              {(step: (typeof meal.steps)[number]) => (
                <li key={step.index} className="rounded-blade border border-line bg-white p-4">
                  <p className="text-sm font-extrabold text-ink">
                    {step.index}. {step.heading}
                    <span className="ml-2 font-mono text-xs font-normal text-ink-3">
                      {step.est_minutes} min
                    </span>
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-2">{step.description}</p>
                </li>
              )}
            </Repeat>
          </ol>
        </section>

        {/* Warned, but never blocked. They know their kitchen better than we do. */}
        <Show when={confirming && missingRequired}>
          <Callout
            tone="caution"
            title={`You are missing ${String(data.missing.length)} thing${data.missing.length === 1 ? '' : 's'}`}
            body={`${data.missing.join(', ')}. You can carry on anyway — you know your kitchen better than we do.`}
            className="mt-5"
          />
        </Show>
      </div>

      <Dock>
        <Dock.Actions>
          <Dock.Primary>
            <Button
              size="lg"
              onClick={() => {
                if (missingRequired && !confirming) {
                  setConfirming(true);
                  return;
                }
                void navigate({ to: ROUTES.COOK(mealId) });
              }}
            >
              {missingRequired && !confirming ? 'Start cooking anyway' : 'Start cooking'}
            </Button>
          </Dock.Primary>
        </Dock.Actions>
      </Dock>
    </div>
  );
}

/**
 * The wait while a named dish becomes a real recipe.
 *
 * It takes a few seconds and writes something permanent, so it says what it is
 * doing rather than showing a bare skeleton — a blank page here reads as a
 * broken link, which is exactly what this feature exists to avoid.
 */
function GeneratingScreen({
  name,
  error,
  onBack,
}: {
  readonly name: string;
  readonly error: string | null;
  readonly onBack: () => void;
}) {
  return (
    <div className="min-h-dvh bg-ground">
      <AppBar title={name.length > 0 ? name : 'A new recipe'} onBack={onBack} backLabel="Back" />

      <div className="mx-auto w-full max-w-[720px] px-5 py-8">
        <Show when={error === null}>
          <div className="rounded-blade border border-grape-border bg-grape-soft p-6 text-center">
            <KoboyoIcon name="robotForAi" size={48} className="text-grape-onsoft" alone />
            <p className="mt-3 font-display text-lg font-extrabold text-ink">
              Writing this one out
            </p>
            <p className="mt-1 text-sm text-ink-2">
              We did not have {name.length > 0 ? `“${name}”` : 'this'}, so it is being written now —
              ingredients, steps and all. It will be saved, so this only happens once.
            </p>
          </div>

          {/* Shaped like the recipe it becomes. */}
          <div className="mt-5 flex flex-col gap-4">
            <div aria-hidden="true" className="h-20 animate-shimmer rounded-blade bg-skeleton" />
            <div aria-hidden="true" className="h-32 animate-shimmer rounded-blade bg-skeleton" />
            <div aria-hidden="true" className="h-48 animate-shimmer rounded-blade bg-skeleton" />
          </div>
        </Show>

        <Show when={error !== null}>
          <Callout
            tone="critical"
            title="We could not write that one"
            body={error ?? ''}
          />
          <Button
            className="mt-4"
            onClick={onBack}
          >
            Back to the assistant
          </Button>
        </Show>
      </div>
    </div>
  );
}
