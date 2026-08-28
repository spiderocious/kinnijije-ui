import { useNavigate } from '@tanstack/react-router';
import { Repeat, Show } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { ROUTES } from '@shared/constants/routes';
import { AppShell } from '@shared/ui-shell/app-shell';
import { CardListSkeleton, ScreenError } from '@shared/ui-shell/screen-states';
import { EmptyState } from '@ui/feedback';
import { Card } from '@ui/structure';

import { useFavourites } from '../hooks/use-meals';
import type { Meal } from '../services/meals.api';

export default function FavouritesScreen() {
  const navigate = useNavigate();
  const { data: meals = [], isLoading, error, refetch } = useFavourites();

  return (
    <AppShell title="Saved" active="saved">
        {/* Loading showed NOTHING before — a blank screen, then rows popping in.
            Shaped placeholders are the honest version of that wait. */}
        <Show when={isLoading}>
          <CardListSkeleton count={4} height="h-20" />
        </Show>

        <Show when={!isLoading && error !== null}>
          <ScreenError
            error={error}
            what="what you have saved"
            onRetry={() => {
              void refetch();
            }}
          />
        </Show>

        <Show when={!isLoading && error === null && meals.length === 0}>
          <EmptyState
            art="bookmark"
            title="Nothing saved yet"
            body="Save a meal you liked and it will be here, ready to cook again."
            action={{
              label: 'Find something to cook',
              onClick: () => {
                void navigate({ to: ROUTES.SUGGESTIONS });
              },
            }}
          />
        </Show>

        <div className="flex flex-col gap-3">
          <Repeat each={meals}>
            {(meal: Meal) => (
              <Card key={meal.id} variant="quiet">
                <button
                  type="button"
                  onClick={() => {
                    void navigate({ to: ROUTES.MEAL(meal.id) });
                  }}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <KoboyoIcon name={(meal.hero_icon ?? 'plateFull') as never} size={32} className="text-sky" alone />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-md font-extrabold">{meal.name}</span>
                    <span className="block font-mono text-xs text-ink-3">
                      {meal.cook_time_minutes} min · {meal.difficulty}
                      {meal.source === 'ai' ? ' · made by AI' : ' · verified'}
                    </span>
                  </span>
                </button>
              </Card>
            )}
          </Repeat>
        </div>
    </AppShell>
  );
}
