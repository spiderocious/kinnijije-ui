import { useMemo, useRef, useState, type ReactNode } from 'react';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Show } from 'meemaw';

import type { ApiError } from '@shared/services/api-client';
import { InfoCard } from '@ui/admin';
import { Callout } from '@ui/feedback';
import { Checkbox, Input } from '@ui/inputs';
import { Button, Segmented } from '@ui/primitives';
import { Tag } from '@ui/status';

import { useRecipeFormOptions } from '../hooks/use-admin';
import type { RecipeFormOptions, RecipeInput } from '../services/admin.api';

/**
 * The recipe form — one component for adding and for editing.
 *
 * A recipe is two ordered lists hanging off a handful of facts, so the form is
 * three cards: the facts, the ingredients, the steps. Everything a cook-facing
 * screen depends on is a real choice rather than free text where it can be:
 * difficulty is one of three, units come from the catalogue, and an ingredient
 * shows — while it is being typed — whether it will match a kitchen.
 *
 * That last one is the point of having a form at all. An ingredient outside
 * the catalogue is saved but can never be matched, which silently makes a
 * recipe unsuggestable; pasted JSON only reveals it after the save.
 *
 * Steps are renumbered from their order. Nobody types an index: moving a step
 * up IS renumbering it, and the server numbers them 1..n the same way.
 */

// ── Shapes ───────────────────────────────────────────────────────────────

/** Strings while editing: an empty quantity is "not given", not zero. */
interface IngredientRow {
  key: number;
  name: string;
  quantity: string;
  unit: string;
  optional: boolean;
}

interface StepRow {
  key: number;
  heading: string;
  description: string;
  minutes: string;
}

interface FormState {
  name: string;
  whatMakesItGood: string;
  description: string;
  status: 'draft' | 'published';
  source: 'seed' | 'ai';
  difficulty: 'easy' | 'medium' | 'involved';
  cookTime: string;
  serves: string;
  cuisines: string[];
  ingredients: IngredientRow[];
  steps: StepRow[];
}

/** What an existing recipe looks like when it arrives for editing. */
export interface RecipeFormInitial {
  name: string;
  what_makes_it_good: string;
  description: string;
  status: 'draft' | 'published';
  source: 'seed' | 'ai';
  difficulty: string;
  cook_time_minutes: number;
  serves: number;
  cuisines: string[];
  ingredients: { name: string; quantity: number | null; unit: string | null; optional: boolean }[];
  steps: { heading: string; description: string; minutes: number }[];
}

interface RecipeFormProps {
  /** Absent when adding a new recipe. */
  readonly initial?: RecipeFormInitial | undefined;
  readonly submitLabel: string;
  readonly pending: boolean;
  readonly error: ApiError | null;
  readonly onSubmit: (input: RecipeInput) => void;
  readonly onCancel: () => void;
}

/** The server's own bounds, mirrored so the form refuses before the request does. */
const LIMITS = { ingredients: 60, steps: 40, cuisines: 8, cookTime: 600, serves: 50 } as const;

const DIFFICULTIES = ['easy', 'medium', 'involved'] as const;
const isDifficulty = (value: string): value is FormState['difficulty'] =>
  (DIFFICULTIES as readonly string[]).includes(value);

// ── Small pieces ─────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
  className,
}: {
  readonly label: string;
  readonly hint?: string;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <label className={['flex min-w-0 flex-col gap-1', className ?? ''].join(' ')}>
      <span className="text-xs font-extrabold text-ink-2">{label}</span>
      {children}
      {hint !== undefined && <span className="text-[11px] text-ink-3">{hint}</span>}
    </label>
  );
}

const AREA_CLASS =
  'w-full rounded-blade-xs border border-line bg-white px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]';

const SELECT_CLASS = 'rounded-blade-xs border border-line bg-white px-2 py-2 text-sm text-ink';

function IconButton({
  label,
  onClick,
  disabled = false,
  danger = false,
  children,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly danger?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={[
        'grid h-8 w-8 shrink-0 place-items-center rounded-blade-xs border border-line bg-white',
        'transition-colors disabled:cursor-default disabled:opacity-30',
        danger ? 'text-critical-onsoft hover:bg-critical-soft' : 'text-ink-2 hover:bg-paper-2',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

// ── The form ─────────────────────────────────────────────────────────────

export function RecipeForm({ initial, submitLabel, pending, error, onSubmit, onCancel }: RecipeFormProps) {
  const { data: options } = useRecipeFormOptions();

  // Row keys only need to be unique within this form's lifetime.
  const nextKey = useRef(1);
  const newKey = (): number => {
    nextKey.current += 1;
    return nextKey.current;
  };

  const [form, setForm] = useState<FormState>(() => ({
    name: initial?.name ?? '',
    whatMakesItGood: initial?.what_makes_it_good ?? '',
    // The server fills an empty description with "what makes it good"; showing
    // that copy back as though somebody wrote it twice would be confusing.
    description:
      initial === undefined || initial.description === initial.what_makes_it_good ? '' : initial.description,
    status: initial?.status ?? 'draft',
    source: initial?.source ?? 'seed',
    difficulty: initial !== undefined && isDifficulty(initial.difficulty) ? initial.difficulty : 'easy',
    cookTime: initial === undefined ? '' : String(initial.cook_time_minutes),
    serves: initial === undefined ? '4' : String(initial.serves),
    // Lowercased on the way in, so a recipe tagged "Nigerian" shows as the
    // existing "nigerian" chip rather than a second, near-identical one.
    cuisines:
      initial === undefined
        ? ['nigerian']
        : [...new Set(initial.cuisines.map((c) => c.trim().toLowerCase()).filter((c) => c.length > 0))],
    ingredients:
      initial === undefined
        ? [{ key: 1, name: '', quantity: '', unit: '', optional: false }]
        : initial.ingredients.map((item, i) => ({
            key: -(i + 1),
            name: item.name,
            quantity: item.quantity === null ? '' : String(item.quantity),
            unit: item.unit ?? '',
            optional: item.optional,
          })),
    steps:
      initial === undefined
        ? [{ key: 1, heading: '', description: '', minutes: '' }]
        : initial.steps.map((step, i) => ({
            key: -(i + 1),
            heading: step.heading,
            description: step.description,
            minutes: String(step.minutes),
          })),
  }));

  const [newCuisine, setNewCuisine] = useState('');
  const [problems, setProblems] = useState<string[]>([]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]): void => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  /**
   * Every name and alias the catalogue answers to, lowercased.
   *
   * The server's matcher is a little more forgiving than an exact lookup, so
   * this can say "not in the catalogue" about a name the server would still
   * place — the save result is the final word, and says so. It is never wrong
   * the other way: anything marked as matching here does match.
   */
  const catalogue = useMemo(() => {
    const map = new Map<string, RecipeFormOptions['ingredients'][number]>();
    for (const item of options?.ingredients ?? []) {
      map.set(item.name.toLowerCase(), item);
      for (const alias of item.aliases) map.set(alias.toLowerCase(), item);
    }
    return map;
  }, [options]);

  const lookup = (name: string) => catalogue.get(name.trim().toLowerCase());

  // ── Ingredients ──
  const patchIngredient = (key: number, changes: Partial<IngredientRow>): void => {
    set(
      'ingredients',
      form.ingredients.map((row) => (row.key === key ? { ...row, ...changes } : row)),
    );
  };

  const renameIngredient = (row: IngredientRow, name: string): void => {
    const hit = lookup(name);
    // A unit nobody chose is filled with the ingredient's usual one — rice in
    // cups, onions in pieces — and never overwrites one that was picked.
    patchIngredient(row.key, {
      name,
      ...(hit !== undefined && row.unit === '' && { unit: hit.default_unit }),
    });
  };

  // ── Steps ──
  const patchStep = (key: number, changes: Partial<StepRow>): void => {
    set(
      'steps',
      form.steps.map((row) => (row.key === key ? { ...row, ...changes } : row)),
    );
  };

  const moveStep = (index: number, by: -1 | 1): void => {
    const target = index + by;
    if (target < 0 || target >= form.steps.length) return;
    const next = [...form.steps];
    const [moved] = next.splice(index, 1);
    if (moved === undefined) return;
    next.splice(target, 0, moved);
    set('steps', next);
  };

  // ── Cuisines ──
  const toggleCuisine = (cuisine: string): void => {
    set(
      'cuisines',
      form.cuisines.includes(cuisine)
        ? form.cuisines.filter((c) => c !== cuisine)
        : [...form.cuisines, cuisine].slice(0, LIMITS.cuisines),
    );
  };

  const addCuisine = (): void => {
    // Lowercased so "Nigerian" joins "nigerian" rather than becoming a second tag.
    const value = newCuisine.trim().toLowerCase();
    setNewCuisine('');
    if (value.length === 0 || form.cuisines.includes(value)) return;
    set('cuisines', [...form.cuisines, value].slice(0, LIMITS.cuisines));
  };

  const cuisineChoices = [...new Set([...(options?.cuisines ?? []), ...form.cuisines])].sort();

  // ── Totals, for the hints ──
  const stepMinutes = form.steps.reduce((sum, row) => sum + (Number(row.minutes) || 0), 0);
  const namedIngredients = form.ingredients.filter((row) => row.name.trim().length > 0);
  const unmatched = namedIngredients.filter((row) => lookup(row.name) === undefined);

  // ── Submit ──
  const submit = (): void => {
    const found: string[] = [];
    const cookTime = Number(form.cookTime);
    const serves = Number(form.serves);

    if (form.name.trim().length === 0) found.push('Give the recipe a name.');
    if (form.whatMakesItGood.trim().length === 0) found.push('Say what makes it good — one line on why anyone cooks it.');
    if (!Number.isInteger(cookTime) || cookTime < 1 || cookTime > LIMITS.cookTime) {
      found.push(`Cook time must be a whole number of minutes, 1 to ${String(LIMITS.cookTime)}.`);
    }
    if (!Number.isInteger(serves) || serves < 1 || serves > LIMITS.serves) {
      found.push(`Serves must be a whole number, 1 to ${String(LIMITS.serves)}.`);
    }
    if (namedIngredients.length === 0) found.push('Add at least one ingredient.');
    for (const row of namedIngredients) {
      if (row.quantity.trim().length > 0 && !(Number(row.quantity) > 0)) {
        found.push(`"${row.name.trim()}" has a quantity that is not a positive number. Leave it empty if there is none.`);
      }
    }

    const steps = form.steps.filter((row) => row.heading.trim().length > 0 || row.description.trim().length > 0);
    if (steps.length === 0) found.push('Add at least one step.');
    steps.forEach((row, i) => {
      if (row.heading.trim().length === 0) found.push(`Step ${String(i + 1)} needs a heading.`);
      if (row.description.trim().length === 0) found.push(`Step ${String(i + 1)} needs instructions.`);
      const minutes = Number(row.minutes === '' ? '0' : row.minutes);
      if (!Number.isInteger(minutes) || minutes < 0 || minutes > 600) {
        found.push(`Step ${String(i + 1)} minutes must be a whole number, 0 to 600.`);
      }
    });

    setProblems(found);
    if (found.length > 0) return;

    onSubmit({
      name: form.name.trim(),
      source: form.source,
      status: form.status,
      cuisines: form.cuisines,
      difficulty: form.difficulty,
      cook_time_minutes: cookTime,
      serves,
      what_makes_it_good: form.whatMakesItGood.trim(),
      ...(form.description.trim().length > 0 && { description: form.description.trim() }),
      ingredients: namedIngredients.map((row) => ({
        name: row.name.trim(),
        quantity: row.quantity.trim().length > 0 ? Number(row.quantity) : null,
        unit: row.unit.length > 0 ? row.unit : null,
        optional: row.optional,
      })),
      steps: steps.map((row, i) => ({
        index: i + 1,
        heading: row.heading.trim(),
        description: row.description.trim(),
        est_minutes: Number(row.minutes === '' ? '0' : row.minutes),
      })),
    });
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {/* ── The facts ─────────────────────────────────────────────────── */}
      <InfoCard title="About the recipe">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name" className="md:col-span-2">
            <Input
              value={form.name}
              maxLength={120}
              placeholder="Ewa Agoyin"
              onChange={(event) => {
                set('name', event.target.value);
              }}
            />
          </Field>

          <Field
            label="What makes it good"
            hint="One line on why anyone cooks it. Shown on the recipe."
            className="md:col-span-2"
          >
            <textarea
              value={form.whatMakesItGood}
              maxLength={400}
              rows={2}
              className={AREA_CLASS}
              placeholder="The sauce is the whole point — peppers fried slowly in bleached oil."
              onChange={(event) => {
                set('whatMakesItGood', event.target.value);
              }}
            />
          </Field>

          <Field
            label="Description"
            hint="Optional. Left empty, the line above is used."
            className="md:col-span-2"
          >
            <textarea
              value={form.description}
              maxLength={2000}
              rows={3}
              className={AREA_CLASS}
              onChange={(event) => {
                set('description', event.target.value);
              }}
            />
          </Field>

          <Field label="Difficulty">
            <Segmented
              value={form.difficulty}
              label="Difficulty"
              onValueChange={(value) => {
                if (isDifficulty(value)) set('difficulty', value);
              }}
            >
              <Segmented.Item value="easy">Easy</Segmented.Item>
              <Segmented.Item value="medium">Medium</Segmented.Item>
              <Segmented.Item value="involved">Involved</Segmented.Item>
            </Segmented>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Cook time (minutes)"
              {...(stepMinutes > 0 && { hint: `The steps add up to ${String(stepMinutes)}.` })}
            >
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={LIMITS.cookTime}
                value={form.cookTime}
                placeholder="45"
                onChange={(event) => {
                  set('cookTime', event.target.value);
                }}
              />
            </Field>
            <Field label="Serves">
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={LIMITS.serves}
                value={form.serves}
                onChange={(event) => {
                  set('serves', event.target.value);
                }}
              />
            </Field>
          </div>

          <Field label="Status" hint="A draft is saved but never suggested to anybody.">
            <Segmented
              value={form.status}
              label="Status"
              onValueChange={(value) => {
                set('status', value === 'published' ? 'published' : 'draft');
              }}
            >
              <Segmented.Item value="draft">Draft</Segmented.Item>
              <Segmented.Item value="published">Published</Segmented.Item>
            </Segmented>
          </Field>

          <Field label="Source" hint="Shown to cooks: written by a person, or generated.">
            <Segmented
              value={form.source}
              label="Source"
              onValueChange={(value) => {
                set('source', value === 'ai' ? 'ai' : 'seed');
              }}
            >
              <Segmented.Item value="seed">Written</Segmented.Item>
              <Segmented.Item value="ai">Generated</Segmented.Item>
            </Segmented>
          </Field>

          <div className="md:col-span-2">
            <span className="text-xs font-extrabold text-ink-2">Cuisines</span>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {cuisineChoices.map((cuisine) => {
                const on = form.cuisines.includes(cuisine);
                return (
                  <button
                    key={cuisine}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      toggleCuisine(cuisine);
                    }}
                    className={[
                      'rounded-pill border px-3 py-1 text-xs font-extrabold transition-colors',
                      on ? 'border-ink bg-sky-soft text-ink' : 'border-line bg-white text-ink-3 hover:border-ink',
                    ].join(' ')}
                  >
                    {cuisine}
                  </button>
                );
              })}
              <span className="flex items-center gap-1.5">
                <Input
                  value={newCuisine}
                  maxLength={40}
                  placeholder="Add another…"
                  aria-label="Add a cuisine"
                  className="w-[150px]"
                  onChange={(event) => {
                    setNewCuisine(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return;
                    // Enter here adds the tag; it must not submit the recipe.
                    event.preventDefault();
                    addCuisine();
                  }}
                />
                <Button size="sm" variant="secondary" type="button" onClick={addCuisine}>
                  Add
                </Button>
              </span>
            </div>
            <p className="mt-1 text-[11px] text-ink-3">
              Up to {LIMITS.cuisines}. Pick an existing one where it fits — the decide flow reads these.
            </p>
          </div>
        </div>
      </InfoCard>

      {/* ── Ingredients ───────────────────────────────────────────────── */}
      <InfoCard title={`Ingredients (${String(namedIngredients.length)})`}>
        <p className="mb-3 text-xs text-ink-3">
          Type to pick from the catalogue. An ingredient that is not in it is still saved, but can
          never be matched against anybody&rsquo;s kitchen. Tick <b>optional</b> for anything the dish
          is still itself without — salt, a garnish — so it never counts as missing.
        </p>

        {/* One list of names for every row's suggestions. */}
        <datalist id="recipe-catalogue">
          {(options?.ingredients ?? []).map((item) => (
            <option key={item.id} value={item.name} />
          ))}
        </datalist>

        <ul className="flex flex-col gap-2">
          {form.ingredients.map((row) => {
            const named = row.name.trim().length > 0;
            const hit = lookup(row.name);
            const unitKnown = (options?.units ?? []).some((unit) => unit.id === row.unit);

            return (
              <li
                key={row.key}
                className="flex flex-wrap items-center gap-2 rounded-blade-xs border border-line/70 bg-paper-2 p-2"
              >
                <div className="min-w-[180px] flex-1">
                  <Input
                    list="recipe-catalogue"
                    value={row.name}
                    maxLength={80}
                    placeholder="Ingredient"
                    aria-label="Ingredient name"
                    onChange={(event) => {
                      renameIngredient(row, event.target.value);
                    }}
                  />
                </div>

                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={row.quantity}
                  placeholder="Qty"
                  aria-label="Quantity"
                  className="w-[84px]"
                  onChange={(event) => {
                    patchIngredient(row.key, { quantity: event.target.value });
                  }}
                />

                <select
                  value={row.unit}
                  aria-label="Unit"
                  className={[SELECT_CLASS, 'w-[124px]'].join(' ')}
                  onChange={(event) => {
                    patchIngredient(row.key, { unit: event.target.value });
                  }}
                >
                  <option value="">no unit</option>
                  {/* A unit already on the recipe that the catalogue does not
                      list is kept selectable, never silently dropped. */}
                  {row.unit !== '' && !unitKnown && <option value={row.unit}>{row.unit}</option>}
                  {(options?.units ?? []).map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.label}
                    </option>
                  ))}
                </select>

                <Checkbox
                  checked={row.optional}
                  onCheckedChange={(optional) => {
                    patchIngredient(row.key, { optional });
                  }}
                >
                  <span className="text-xs font-bold text-ink-2">optional</span>
                </Checkbox>

                <span className="w-[112px] shrink-0">
                  {named && options !== undefined && (
                    <Tag size="sm" tone={hit !== undefined ? 'info' : 'neutral'}>
                      {hit !== undefined ? 'will match' : 'not in catalogue'}
                    </Tag>
                  )}
                </span>

                <IconButton
                  label="Remove ingredient"
                  danger
                  disabled={form.ingredients.length === 1}
                  onClick={() => {
                    set(
                      'ingredients',
                      form.ingredients.filter((other) => other.key !== row.key),
                    );
                  }}
                >
                  <Trash2 size={15} strokeWidth={2.2} />
                </IconButton>
              </li>
            );
          })}
        </ul>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            type="button"
            disabled={form.ingredients.length >= LIMITS.ingredients}
            onClick={() => {
              set('ingredients', [
                ...form.ingredients,
                { key: newKey(), name: '', quantity: '', unit: '', optional: false },
              ]);
            }}
          >
            <Plus size={14} strokeWidth={2.6} className="mr-1" />
            Add ingredient
          </Button>
          <Show when={unmatched.length > 0 && options !== undefined}>
            <span className="text-xs font-bold text-caution-onsoft">
              {unmatched.length} not in the catalogue: {unmatched.map((row) => row.name.trim()).join(', ')}
            </span>
          </Show>
        </div>
      </InfoCard>

      {/* ── Steps ─────────────────────────────────────────────────────── */}
      <InfoCard title={`Steps (${String(form.steps.length)})`}>
        <p className="mb-3 text-xs text-ink-3">
          In the order they are cooked. Use the arrows to reorder — the numbers follow.
        </p>

        <ol className="flex flex-col gap-2">
          {form.steps.map((row, index) => (
            <li
              key={row.key}
              className="flex gap-2 rounded-blade-xs border border-line/70 bg-paper-2 p-2"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-round bg-white font-mono text-xs font-extrabold text-ink-2">
                {index + 1}
              </span>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="min-w-[180px] flex-1">
                    <Input
                      value={row.heading}
                      maxLength={80}
                      placeholder="Heading — Boil the beans"
                      aria-label={`Step ${String(index + 1)} heading`}
                      onChange={(event) => {
                        patchStep(row.key, { heading: event.target.value });
                      }}
                    />
                  </div>
                  <span className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={600}
                      value={row.minutes}
                      placeholder="0"
                      aria-label={`Step ${String(index + 1)} minutes`}
                      className="w-[76px]"
                      onChange={(event) => {
                        patchStep(row.key, { minutes: event.target.value });
                      }}
                    />
                    <span className="text-xs text-ink-3">min</span>
                  </span>
                </div>

                <textarea
                  value={row.description}
                  maxLength={2000}
                  rows={3}
                  className={AREA_CLASS}
                  placeholder="What to do, in the words you would say it."
                  aria-label={`Step ${String(index + 1)} instructions`}
                  onChange={(event) => {
                    patchStep(row.key, { description: event.target.value });
                  }}
                />
              </div>

              <div className="flex shrink-0 flex-col gap-1">
                <IconButton
                  label="Move step up"
                  disabled={index === 0}
                  onClick={() => {
                    moveStep(index, -1);
                  }}
                >
                  <ArrowUp size={15} strokeWidth={2.4} />
                </IconButton>
                <IconButton
                  label="Move step down"
                  disabled={index === form.steps.length - 1}
                  onClick={() => {
                    moveStep(index, 1);
                  }}
                >
                  <ArrowDown size={15} strokeWidth={2.4} />
                </IconButton>
                <IconButton
                  label="Remove step"
                  danger
                  disabled={form.steps.length === 1}
                  onClick={() => {
                    set(
                      'steps',
                      form.steps.filter((other) => other.key !== row.key),
                    );
                  }}
                >
                  <Trash2 size={15} strokeWidth={2.2} />
                </IconButton>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-3">
          <Button
            size="sm"
            variant="secondary"
            type="button"
            disabled={form.steps.length >= LIMITS.steps}
            onClick={() => {
              set('steps', [...form.steps, { key: newKey(), heading: '', description: '', minutes: '' }]);
            }}
          >
            <Plus size={14} strokeWidth={2.6} className="mr-1" />
            Add step
          </Button>
        </div>
      </InfoCard>

      {/* ── What stops the save, and the save ─────────────────────────── */}
      <Show when={problems.length > 0}>
        <Callout
          tone="caution"
          title="A few things to fix first"
          body={
            <ul className="list-disc pl-4">
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          }
        />
      </Show>

      <Show when={error !== null}>
        <Callout
          tone="critical"
          title="The server refused it"
          body={
            <span className="flex flex-col gap-1">
              <span>{error?.message}</span>
              {/* The server names the field; show it rather than a vague refusal. */}
              {Object.entries(error?.fieldErrors ?? {}).map(([field, messages]) => (
                <span key={field} className="font-mono text-xs">
                  {field}: {messages.join(' ')}
                </span>
              ))}
            </span>
          }
        />
      </Show>

      <div className="flex items-center gap-2">
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
