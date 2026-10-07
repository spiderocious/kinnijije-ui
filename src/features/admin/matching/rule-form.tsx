import { useState } from 'react';

import { Show } from 'meemaw';

import type { ApiError } from '@shared/services/api-client';
import { Callout } from '@ui/feedback';
import { Input, MultiSelect, NumberInput, Select, Switch } from '@ui/inputs';
import { Button } from '@ui/primitives';

import { useRecipeFormOptions } from '../hooks/use-admin';
import type { RulePayload, RuleWhen, RuleThen, RuleBranch } from '../services/matching.api';
import { IngredientPicker } from './ingredient-picker';

/**
 * The form editor: interface one from the brief.
 *
 * Purely visual — dropdowns, inputs and lists. A curator picks ingredients, a
 * time constraint, a mood and a time, then names the meals to serve. No
 * expression language, because the people who know that ogbono and palm oil on
 * a rainy evening means soup should not have to learn one.
 *
 * THE FORM IS THE REFERENCE EDITOR. The canvas in stage 6 reads and writes the
 * same document, and a canvas feature that cannot round-trip through this form
 * does not ship — otherwise the two have forked and a rule means different
 * things depending on where you opened it.
 */

const MOOD_OPTIONS = [
  { value: 'tired', label: 'Tired' },
  { value: 'fast', label: 'In a hurry' },
  { value: 'proper', label: 'Up for it' },
  { value: 'comfort', label: 'Wants comfort' },
  { value: 'whatever', label: 'No preference' },
] as const;

const WEIGHT_OPTIONS = [
  { value: 'solid', label: 'Solid' },
  { value: 'light', label: 'Light' },
  { value: 'soupy', label: 'Soupy' },
  { value: 'swallow', label: 'Swallow' },
  { value: 'rice', label: 'Rice' },
  { value: 'street', label: 'Street food' },
] as const;

const WEATHER_OPTIONS = [
  { value: '', label: 'Any weather' },
  { value: 'rainy', label: 'Raining' },
  { value: 'clear', label: 'Not raining' },
] as const;

const MODE_OPTIONS = [
  { value: 'replace', label: 'Serve these instead' },
  { value: 'boost', label: 'Lift these within the ranking' },
] as const;

export interface RuleFormValues {
  name: string;
  description: string;
  priority: number;
  shadow: boolean;
  when: RuleWhen;
  then: RuleThen;
  branches: RuleBranch[];
}

const EMPTY: RuleFormValues = {
  name: '',
  description: '',
  priority: 0,
  // New rules default to SHADOW. A rule nobody has measured should not be
  // deciding dinner, and one day of shadow turns "I think this is better"
  // into a number. The curator can turn it off deliberately.
  shadow: true,
  when: {},
  then: { meals: [], mode: 'replace', boost: null },
  branches: [],
};

/** A clause section, so the form reads as "when… then…" rather than a wall. */
function Section({
  title,
  hint,
  children,
}: {
  readonly title: string;
  readonly hint?: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="rounded-blade border border-line bg-white p-4">
      <h3 className="font-display text-base font-extrabold text-ink">{title}</h3>
      <Show when={hint !== undefined}>
        <p className="mb-3 mt-0.5 text-xs text-ink-3">{hint}</p>
      </Show>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

/**
 * A numeric window.
 *
 * Both bounds optional, because "under 20 minutes" is a thing a curator wants
 * to say without inventing a floor — a floor of 0 would read as deliberate.
 */
function RangeFields({
  label,
  value,
  onChange,
  min,
  max,
  hint,
}: {
  readonly label: string;
  readonly value: { min?: number | null; max?: number | null } | undefined;
  readonly onChange: (next: { min?: number | null; max?: number | null } | undefined) => void;
  readonly min?: number;
  readonly max?: number;
  readonly hint?: string;
}) {
  const current = value ?? {};

  const update = (key: 'min' | 'max', next: number | null): void => {
    const merged = { ...current, [key]: next };
    // Both cleared means the clause is gone, not a clause with no bounds —
    // which would be an empty constraint pretending to be one.
    if ((merged.min ?? null) === null && (merged.max ?? null) === null) onChange(undefined);
    else onChange(merged);
  };

  return (
    <div>
      <p className="mb-1 text-xs font-extrabold uppercase tracking-overline text-ink-3">{label}</p>
      <div className="flex items-end gap-2">
        <NumberInput
          aria-label={`${label} from`}
          value={current.min ?? null}
          onChange={(next) => {
            update('min', next);
          }}
          placeholder="from"
          {...(min !== undefined && { min })}
          {...(max !== undefined && { max })}
        />
        <span className="pb-2 text-xs text-ink-3">to</span>
        <NumberInput
          aria-label={`${label} to`}
          value={current.max ?? null}
          onChange={(next) => {
            update('max', next);
          }}
          placeholder="to"
          {...(min !== undefined && { min })}
          {...(max !== undefined && { max })}
        />
      </div>
      <Show when={hint !== undefined}>
        <p className="mt-1 text-xs text-ink-3">{hint}</p>
      </Show>
    </div>
  );
}

export function RuleForm({
  initial,
  submitLabel,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  readonly initial?: Partial<RuleFormValues> | undefined;
  readonly submitLabel: string;
  readonly pending: boolean;
  readonly error: ApiError | null;
  readonly onSubmit: (payload: RulePayload) => void;
  readonly onCancel: () => void;
}) {
  const [values, setValues] = useState<RuleFormValues>({ ...EMPTY, ...initial });
  const { data: options } = useRecipeFormOptions();

  const ingredientOptions = (options?.ingredients ?? []).map((item) => ({
    value: item.id,
    label: item.name,
  }));

  const patch = (next: Partial<RuleFormValues>): void => {
    setValues((current) => ({ ...current, ...next }));
  };

  const patchWhen = (next: Partial<RuleWhen>): void => {
    setValues((current) => ({ ...current, when: { ...current.when, ...next } }));
  };

  const valid = values.name.trim().length > 0 && values.then.meals.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <Section title="What this rule is">
        <Input
          aria-label="Rule name"
          placeholder="Rainy evening soup"
          value={values.name}
          onChange={(event) => {
            patch({ name: event.target.value });
          }}
        />
        <Input
          aria-label="Description"
          placeholder="Why this rule exists, in your own words"
          value={values.description}
          onChange={(event) => {
            patch({ description: event.target.value });
          }}
        />
      </Section>

      <Section
        title="When"
        hint="Every condition you set must hold. Leave one blank and it is not considered."
      >
        {/* Searchable rather than a 417-row dropdown. Same picker in all
            three so the three clauses behave identically. */}
        <IngredientPicker
          label="Has all of"
          value={values.when.allOf ?? []}
          onChange={(next) => {
            patchWhen({ allOf: next.length === 0 ? undefined : next });
          }}
          options={ingredientOptions}
          placeholder="Ingredients they must have"
        />
        <IngredientPicker
          label="Has any of"
          value={values.when.anyOf ?? []}
          onChange={(next) => {
            patchWhen({ anyOf: next.length === 0 ? undefined : next });
          }}
          options={ingredientOptions}
          placeholder="At least one of these"
        />
        <IngredientPicker
          label="Does not have"
          value={values.when.noneOf ?? []}
          onChange={(next) => {
            patchWhen({ noneOf: next.length === 0 ? undefined : next });
          }}
          options={ingredientOptions}
          placeholder="Anything that rules this out"
        />
        <MultiSelect
          label="Mood"
          value={values.when.moods ?? []}
          onValueChange={(next) => {
            patchWhen({ moods: next.length === 0 ? undefined : [...next] });
          }}
          options={MOOD_OPTIONS}
          placeholder="Any mood"
        />
        <MultiSelect
          label="Wants"
          value={values.when.weights ?? []}
          onValueChange={(next) => {
            patchWhen({ weights: next.length === 0 ? undefined : [...next] });
          }}
          options={WEIGHT_OPTIONS}
          placeholder="Any kind of meal"
        />
        <RangeFields
          label="Time they have (minutes)"
          value={values.when.minutes}
          onChange={(next) => {
            patchWhen({ minutes: next });
          }}
          min={0}
          max={240}
        />
        <RangeFields
          label="Hour of day"
          value={values.when.hour}
          onChange={(next) => {
            patchWhen({ hour: next });
          }}
          min={0}
          max={23}
          hint="Lagos time. A window from a later hour to an earlier one wraps midnight, so 22 to 2 is late night."
        />
        <Select
          label="Weather"
          value={values.when.weather ?? ''}
          onValueChange={(next) => {
            patchWhen({ weather: next === '' ? null : (next as 'rainy' | 'clear') });
          }}
          options={WEATHER_OPTIONS}
        />
      </Section>

      <Section
        title="Then serve"
        hint="The first meal is the verdict. The rest become the alternates."
      >
        <Select
          label="How"
          value={values.then.mode}
          onValueChange={(next) => {
            patch({ then: { ...values.then, mode: next as 'replace' | 'boost' } });
          }}
          options={MODE_OPTIONS}
        />
        <Show when={values.then.mode === 'boost'}>
          <NumberInput
            aria-label="Boost multiplier"
            value={values.then.boost ?? 1.5}
            onChange={(next) => {
              patch({ then: { ...values.then, boost: next ?? 1.5 } });
            }}
            min={1}
            max={5}
            step={0.1}
          />
        </Show>
        <Input
          aria-label="Meal ids"
          placeholder="meal_… , meal_…"
          value={values.then.meals.join(', ')}
          onChange={(event) => {
            patch({
              then: {
                ...values.then,
                meals: event.target.value
                  .split(',')
                  .map((part) => part.trim())
                  .filter((part) => part.length > 0),
              },
            });
          }}
        />
        <p className="text-xs text-ink-3">
          Meals must be published. An unpublished meal is refused on save rather than failing
          quietly at serving time.
        </p>
      </Section>

      <Section
        title="How it behaves"
        hint="A new rule starts in shadow so you can measure it before it decides anybody's dinner."
      >
        <Switch
          checked={values.shadow}
          onCheckedChange={(next) => {
            patch({ shadow: next });
          }}
          label="Shadow mode"
        />
        <p className="text-xs text-ink-3">
          In shadow the rule records what it would have served, and serves nothing.
        </p>
        <NumberInput
          aria-label="Priority"
          value={values.priority}
          onChange={(next) => {
            patch({ priority: next ?? 0 });
          }}
          min={-100}
          max={100}
        />
        <p className="text-xs text-ink-3">
          Priority only separates rules that test the same number of conditions. The more
          specific rule wins first, whatever the priority.
        </p>
      </Section>

      <Show when={error !== null}>
        <Callout
          tone="critical"
          title="Could not save"
          body={error?.message ?? 'Something went wrong.'}
        />
      </Show>

      <div className="flex flex-wrap gap-2">
        <Button
          loading={pending}
          disabled={!valid}
          onClick={() => {
            onSubmit({
              name: values.name.trim(),
              description: values.description.trim() === '' ? null : values.description.trim(),
              priority: values.priority,
              shadow: values.shadow,
              when: values.when,
              then: values.then,
              branches: values.branches,
            });
          }}
        >
          {submitLabel}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
