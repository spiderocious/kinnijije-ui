import { useNavigate, useParams } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { Callout } from '@ui/feedback';
import { Button } from '@ui/primitives';

import { useAdminRecipe, useProposeRecipeUpdate, useRecipeLocks } from '../hooks/use-admin';
import { ConsoleShell } from '../parts/console-shell';
import { RecipeForm } from '../recipes/recipe-form';

/**
 * Editing one recipe.
 *
 * The same form as adding one, filled in. It replaces the recipe's content
 * whole — name, facts, ingredients, steps — and leaves alone what the form does
 * not show: its images, and its slug. The slug is the recipe's address, so a
 * rename never breaks a link somebody saved.
 *
 * SINCE THE APPROVAL ENGINE LANDED this screen no longer writes. It raises a
 * request, and the change applies when somebody with the approval scope says
 * yes. The button says so, and the success path goes to the request rather
 * than back to a recipe that has not changed — otherwise somebody closes the
 * tab believing their edit is live.
 */
export default function AdminRecipeEditScreen() {
  const navigate = useNavigate();
  const { mealId } = useParams({ strict: false }) as { mealId: string };

  const { data, isLoading, error } = useAdminRecipe(mealId);
  const propose = useProposeRecipeUpdate();
  // Is somebody already waiting on this one? Editing on top of a pending
  // request produces a change that is guaranteed to be refused as a conflict,
  // so it is worth saying before they type rather than after they submit.
  const { data: lockData } = useRecipeLocks([mealId]);
  const lockedBy = lockData?.locks[mealId];

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

      {/* The lock. Not a hard block — somebody may legitimately need to
          supersede a request — but editing on top of a pending one will be
          refused at approval as a conflict, and that is worth knowing now. */}
      <Show when={lockedBy !== undefined}>
        <div className="mb-4">
          <Callout
            tone="caution"
            title="A change to this recipe is already waiting for approval"
            body="If you submit another, it will conflict with the one in the queue once either is approved. Open the pending request first."
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  if (lockedBy !== undefined) {
                    void navigate({ to: ROUTES.ADMIN_WORKFLOW(lockedBy) });
                  }
                }}
              >
                Open the request
              </Button>
            }
          />
        </div>
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
          submitLabel="Submit for approval"
          pending={propose.isPending}
          error={propose.error}
          onSubmit={(input) => {
            propose.mutate(
              { mealId, input },
              {
                // To the request, not back to the recipe: the recipe has not
                // changed yet, and landing on it would read as a save.
                onSuccess: (workflow) => {
                  void navigate({ to: ROUTES.ADMIN_WORKFLOW(workflow.id) });
                },
              },
            );
          }}
          onCancel={back}
        />
      </Show>
    </ConsoleShell>
  );
}
