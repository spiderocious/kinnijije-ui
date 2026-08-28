import { useNavigate } from '@tanstack/react-router';
import { Repeat, Show } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { ROUTES } from '@shared/constants/routes';
import { AppShell } from '@shared/ui-shell/app-shell';
import { CardListSkeleton, ScreenError } from '@shared/ui-shell/screen-states';
import { cn } from '@shared/utils/cn';
import { EmptyState } from '@ui/feedback';
import { Button } from '@ui/primitives';
import { Card } from '@ui/structure';

import { useSuggestions } from '../hooks/use-meals';
import type { MealSuggestion } from '../services/meals.api';

/**
 * The five closest meals, worked out in code.
 *
 * No model involved — the answer is explainable, instant and free. Asking the
 * AI is a separate, deliberate choice.
 */
export default function SuggestionsScreen() {
  const navigate = useNavigate();
  const { data: suggestions = [], isLoading, error, refetch, isFetching } = useSuggestions();

  return (
    <AppShell title="What you could cook" active="kitchen">
        <Show when={isLoading}>
          {/* Mirrors the cards these become, so the layout does not jump. */}
          <CardListSkeleton count={3} />
        </Show>

        <Show when={!isLoading && error !== null}>
          <ScreenError
            error={error}
            what="what you could cook"
            onRetry={() => {
              void refetch();
            }}
          />
        </Show>

        <Show when={!isLoading && error === null && suggestions.length === 0}>
          <EmptyState
            art="searchSlash"
            title="Nothing close enough yet"
            body="Add a few more things to your kitchen and this fills up fast."
            action={{
              label: 'Add to my kitchen',
              onClick: () => {
                void navigate({ to: ROUTES.STOCK_ADD });
              },
            }}
          />
        </Show>

        <div className="flex flex-col gap-4">
          <Repeat each={suggestions}>
            {(suggestion: MealSuggestion) => (
              <Card
                key={suggestion.meal.id}
                variant={suggestion.missing.length === 0 ? 'loud' : 'quiet'}
                className="cursor-pointer"
              >
                <button
                  type="button"
                  onClick={() => {
                    void navigate({ to: ROUTES.MEAL(suggestion.meal.id) });
                  }}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-3">
                    <KoboyoIcon
                      name={(suggestion.meal.hero_icon ?? 'plateFull') as never}
                      size={40}
                      className="shrink-0 text-sky"
                      alone
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-extrabold leading-tight tracking-display">
                        {suggestion.meal.name}
                      </p>
                      <p className="mt-1 text-sm text-ink-2">{suggestion.match_line}</p>
                      <p className="mt-1 font-mono text-xs text-ink-3">
                        {suggestion.meal.cook_time_minutes} min · {suggestion.meal.difficulty}
                        {suggestion.meal.source === 'ai' ? ' · made by AI' : ' · verified'}
                      </p>
                    </div>
                  </div>

                  <Show when={suggestion.missing.length > 0}>
                    <p className="mt-3 text-sm text-caution-onsoft">
                      Missing: {suggestion.missing.join(', ')}
                    </p>
                  </Show>

                  <Show when={suggestion.low.length > 0}>
                    <p className="mt-1 text-sm text-ink-3">
                      Might be short on: {suggestion.low.join(', ')}
                    </p>
                  </Show>
                </button>
              </Card>
            )}
          </Repeat>
        </div>

        <Show when={suggestions.length > 0}>
          <Button
            variant="secondary"
            fullWidth
            className="mt-5"
            loading={isFetching}
            onClick={() => {
              void refetch();
            }}
          >
            Show me something else
          </Button>
        </Show>

        <Button
          variant="tertiary"
          fullWidth
          className={cn('mt-3')}
          onClick={() => {
            void navigate({ to: ROUTES.CHAT });
          }}
        >
          Or ask the AI instead
        </Button>
    </AppShell>
  );
}
