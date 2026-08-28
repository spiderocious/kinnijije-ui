import { useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Repeat, Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { InfoCard } from '@ui/admin';
import { Callout } from '@ui/feedback';
import { Button } from '@ui/primitives';

import { useBulkRecipes } from '../hooks/use-admin';
import { ConsoleShell } from '../parts/console-shell';
import type { RecipeInput } from '../services/admin.api';

/** A worked example, so nobody has to guess the shape. */
const EXAMPLE = JSON.stringify(
  [
    {
      name: 'Ewa Agoyin',
      difficulty: 'medium',
      cook_time_minutes: 90,
      serves: 4,
      what_makes_it_good: 'The sauce is the whole point — peppers fried slowly in bleached oil.',
      cuisines: ['nigerian', 'yoruba'],
      ingredients: [
        { name: 'honey beans', quantity: 3, unit: 'congo' },
        { name: 'dried chilli', quantity: 10, unit: 'piece' },
        { name: 'palm oil', quantity: 1, unit: 'cup' },
        { name: 'onion', quantity: 2, unit: 'piece' },
        { name: 'salt', optional: true },
      ],
      steps: [
        {
          index: 1,
          heading: 'Boil the beans',
          description: 'Boil until completely soft and falling apart. This takes an hour or more.',
          est_minutes: 70,
        },
        {
          index: 2,
          heading: 'Bleach the oil',
          description: 'Heat palm oil until it clears. Open a window — it will smoke.',
          est_minutes: 8,
        },
        {
          index: 3,
          heading: 'Fry the sauce',
          description: 'Blend peppers and onion, fry slowly in the bleached oil until deep red.',
          est_minutes: 12,
        },
      ],
    },
  ],
  null,
  2,
);

/**
 * Adding recipes.
 *
 * One paste box rather than a form: a recipe has nested ingredients and steps,
 * and every hand-built form for that shape ends up slower to use than typing
 * the JSON. It takes ONE or MANY — an array is the only accepted top level, so
 * the same box does both.
 */
export default function AdminRecipeNewScreen() {
  const navigate = useNavigate();
  const [text, setText] = useState(EXAMPLE);
  const [parseError, setParseError] = useState<string | null>(null);

  const bulk = useBulkRecipes();

  const submit = (): void => {
    setParseError(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'That is not valid JSON.');
      return;
    }

    // A single object is a reasonable thing to paste, so it is wrapped rather
    // than refused.
    const recipes = (Array.isArray(parsed) ? parsed : [parsed]) as RecipeInput[];
    if (recipes.length === 0) {
      setParseError('Nothing to import.');
      return;
    }

    bulk.mutate(recipes);
  };

  const result = bulk.data;

  return (
    <ConsoleShell
      active="recipes"
      title="Add recipes"
      actions={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            void navigate({ to: ROUTES.ADMIN_RECIPES });
          }}
        >
          Back
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <InfoCard title="Paste one recipe, or an array of them">
          <textarea
            value={text}
            onChange={(event) => {
              setText(event.target.value);
            }}
            spellCheck={false}
            rows={26}
            className="w-full rounded-blade-sm border border-line bg-paper-2 p-3 font-mono text-xs text-ink focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]"
          />

          <div className="mt-3 flex items-center gap-2">
            <Button loading={bulk.isPending} onClick={submit}>
              Import
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setText(EXAMPLE);
                setParseError(null);
              }}
            >
              Reset to the example
            </Button>
          </div>

          <Show when={parseError !== null}>
            <Callout tone="critical" title="Could not read that" body={parseError ?? ''} className="mt-3" />
          </Show>

          <Show when={bulk.error !== null}>
            <Callout
              tone="critical"
              title="The server refused it"
              body={bulk.error?.message}
              className="mt-3"
            />
          </Show>
        </InfoCard>

        <div className="flex flex-col gap-4">
          <InfoCard title="What is required">
            <ul className="flex flex-col gap-1.5 text-sm text-ink-2">
              <li>
                <code className="font-mono text-xs">name</code>, and a line saying what makes it
                good
              </li>
              <li>
                <code className="font-mono text-xs">difficulty</code> — easy, medium or involved
              </li>
              <li>
                <code className="font-mono text-xs">cook_time_minutes</code> and{' '}
                <code className="font-mono text-xs">serves</code>
              </li>
              <li>at least one ingredient and one step</li>
            </ul>
            <p className="mt-3 text-xs text-ink-3">
              Ingredient names are matched against the catalogue on save. Anything we cannot place
              is kept, but is invisible to suggestions — the result below says which.
            </p>
          </InfoCard>

          <Show when={result !== undefined}>
            <InfoCard
              title="Result"
              tone={(result?.failed ?? 0) > 0 ? 'caution' : 'default'}
            >
              <p className="text-sm">
                <span className="font-extrabold text-success-onsoft">
                  {result?.created ?? 0} saved
                </span>
                <Show when={(result?.failed ?? 0) > 0}>
                  <span className="text-critical-onsoft">
                    {' '}
                    · {result?.failed} refused
                  </span>
                </Show>
              </p>

              <ul className="mt-3 flex flex-col gap-2">
                <Repeat each={result?.results ?? []}>
                  {(row: {
                    index: number;
                    name: string;
                    ok: boolean;
                    id?: string;
                    error?: string;
                    unmatched?: string[];
                  }) => (
                    <li key={row.index} className="border-b border-line/60 pb-2 text-sm last:border-0">
                      <p className={row.ok ? 'text-ink' : 'text-critical-onsoft'}>
                        {row.ok ? '✓' : '✗'} {row.name}
                      </p>
                      <Show when={row.error !== undefined}>
                        <p className="text-xs text-critical-onsoft">{row.error}</p>
                      </Show>
                      <Show when={(row.unmatched?.length ?? 0) > 0}>
                        <p className="text-xs text-caution-onsoft">
                          unmatched: {row.unmatched?.join(', ')}
                        </p>
                      </Show>
                    </li>
                  )}
                </Repeat>
              </ul>
            </InfoCard>
          </Show>
        </div>
      </div>
    </ConsoleShell>
  );
}
