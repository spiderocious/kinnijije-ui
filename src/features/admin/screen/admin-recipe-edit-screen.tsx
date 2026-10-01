import { useNavigate, useParams } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { Callout } from '@ui/feedback';
import { Button } from '@ui/primitives';

import { useAdminRecipe, useUpdateRecipe } from '../hooks/use-admin';
import { ConsoleShell } from '../parts/console-shell';
import { RecipeForm } from '../recipes/recipe-form';

/**
 * Editing one recipe.
 *
 * The same form as adding one, filled in. Saving replaces the recipe's content
 * whole — name, facts, ingredients, steps — and leaves alone what the form does
 * not show: its images, and its slug. The slug is the recipe's address, so a
 * rename never breaks a link somebody saved.
 */
export default function AdminRecipeEditScreen() {
  const navigate = useNavigate();
  const { mealId } = useParams({ strict: false }) as { mealId: string };

  const { data, isLoading, error } = useAdminRecipe(mealId);
  const update = useUpdateRecipe();

  const back = (): void => {
    void navigate({ to: ROUTES.ADMIN_RECIPE(mealId) });
  };

  return (
    <ConsoleShell
      active="recipes"
      title={data === undefined ? 'Edit recipe' : `Edit · ${data.name}`}
      actions={
        <Button variant="secondary" size="sm" onClick={back}>
          Back
        </Button>
      }
    >
      <Show when={isLoading}>
        <div aria-hidden="true" className="h-64 animate-shimmer rounded-blade bg-skeleton" />
      </Show>

      <Show when={error !== null}>
        <Callout tone="critical" title="This recipe did not load" body={error?.message ?? ''} />
      </Show>

      {/* Mounted only once the recipe is here: the form reads its starting
          values a single time, so it must not start from an empty one. Keyed
          by the save time, so a save made elsewhere re-seeds it. */}
      <Show when={data !== undefined}>
        <RecipeForm
          key={`${mealId}:${data?.updated_at ?? ''}`}
          initial={
            data === undefined
              ? undefined
              : {
                  name: data.name,
                  what_makes_it_good: data.what_makes_it_good,
                  description: data.description,
                  status: data.status,
                  source: data.source,
                  difficulty: data.difficulty,
                  cook_time_minutes: data.cook_time_minutes,
                  serves: data.serves,
                  cuisines: data.cuisines,
                  ingredients: data.ingredients.map((item) => ({
                    name: item.name,
                    quantity: item.quantity,
                    unit: item.unit,
                    optional: item.optional,
                  })),
                  steps: data.steps.map((step) => ({
                    heading: step.heading,
                    description: step.description,
                    minutes: step.estMinutes,
                  })),
                }
          }
          submitLabel="Save changes"
          pending={update.isPending}
          error={update.error}
          onSubmit={(input) => {
            update.mutate({ mealId, input }, { onSuccess: back });
          }}
          onCancel={back}
        />
      </Show>
    </ConsoleShell>
  );
}
