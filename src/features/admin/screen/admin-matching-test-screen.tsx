import { useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { InfoCard } from '@ui/admin';
import { Callout } from '@ui/feedback';
import { NumberInput, Select, Switch } from '@ui/inputs';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';

import { useRecipeFormOptions } from '../hooks/use-admin';
import { useTestRules } from '../hooks/use-matching';
import { IngredientPicker } from '../matching/ingredient-picker';
import { ConsoleShell } from '../parts/console-shell';

/**
 * Test a kitchen.
 *
 * Type in a configuration and see which rule fires, in the order the engine
 * would resolve them. Drafts are included, so a curator can check an
 * unpublished rule before asking anybody to approve it.
 *
 * This is what makes the precedence order visible rather than a thing people
 * discover from a complaint.
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

const MINUTE_OPTIONS = [
  { value: '15', label: '15 minutes' },
  { value: '40', label: '40 minutes' },
  { value: '90', label: '90 minutes' },
] as const;

const WEATHER_OPTIONS = [
  { value: '', label: 'No reading' },
  { value: 'rainy', label: 'Raining' },
  { value: 'clear', label: 'Not raining' },
] as const;

export default function AdminMatchingTestScreen() {
  const navigate = useNavigate();
  const { data: options } = useRecipeFormOptions();
  const test = useTestRules();

  const [have, setHave] = useState<readonly string[]>([]);
  const [mood, setMood] = useState('tired');
  const [weight, setWeight] = useState('rice');
  const [minutes, setMinutes] = useState('40');
  const [hour, setHour] = useState(19);
  const [weather, setWeather] = useState('');
  const [includeDrafts, setIncludeDrafts] = useState(true);

  const ingredientOptions = (options?.ingredients ?? []).map((item) => ({
    value: item.id,
    label: item.name,
  }));

  const matches = test.data?.matches ?? [];

  return (
    <ConsoleShell
      active="matching"
      title="Test a kitchen"
      actions={
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            void navigate({ to: ROUTES.ADMIN_MATCHING });
          }}
        >
          Back to rules
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard title="The request">
          <div className="flex flex-col gap-3">
            {/* Searchable, not a dropdown: the catalogue holds 417 items and
                scrolling them to find palm oil is not a picker. */}
            <IngredientPicker
              label="In their kitchen"
              value={have}
              onChange={setHave}
              options={ingredientOptions}
              placeholder="Type an ingredient…"
            />
            <Select label="Mood" value={mood} onValueChange={setMood} options={MOOD_OPTIONS} />
            <Select
              label="Wants"
              value={weight}
              onValueChange={setWeight}
              options={WEIGHT_OPTIONS}
            />
            <Select
              label="Time they have"
              value={minutes}
              onValueChange={setMinutes}
              options={MINUTE_OPTIONS}
            />
            {/* A visible label, not just an aria one: an operator reading the
                form needs to know this is the clock, and 19 on its own does
                not say so. */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="test-hour"
                className="text-xs font-extrabold uppercase tracking-overline text-ink-3"
              >
                Hour of day
              </label>
              <NumberInput
                id="test-hour"
                value={hour}
                onChange={(next) => {
                  setHour(next ?? 19);
                }}
                min={0}
                max={23}
                unit=":00"
              />
              <p className="text-xs text-ink-3">Lagos time, 0 to 23.</p>
            </div>
            <Select
              label="Weather"
              value={weather}
              onValueChange={setWeather}
              options={WEATHER_OPTIONS}
            />
            <Switch
              checked={includeDrafts}
              onCheckedChange={setIncludeDrafts}
              label="Include drafts"
            />

            <Button
              loading={test.isPending}
              onClick={() => {
                test.mutate({
                  have: [...have],
                  mood,
                  weight,
                  minutes: Number(minutes) as 15 | 40 | 90,
                  hour,
                  weather: weather === '' ? null : (weather as 'rainy' | 'clear'),
                  include_drafts: includeDrafts,
                });
              }}
            >
              See which rule fires
            </Button>
          </div>
        </InfoCard>

        <InfoCard title="What would happen">
          <Show when={test.isIdle}>
            <p className="text-sm text-ink-3">
              Set up a kitchen and run it. Rules are listed in the order the engine resolves
              them, so the first is the one that would decide.
            </p>
          </Show>

          <Show when={test.error !== null}>
            <Callout
              tone="critical"
              title="Could not run the test"
              body={test.error?.message ?? 'Something went wrong.'}
            />
          </Show>

          <Show when={test.isSuccess && matches.length === 0}>
            <Callout
              tone="info"
              title="No rule matches this"
              body="The ranker would decide, exactly as it did before the studio existed. That is the normal case."
            />
          </Show>

          <Show when={matches.length > 0}>
            <div className="flex flex-col gap-2">
              {matches.slice().map((match, position) => (
                <button
                  key={match.id}
                  type="button"
                  className={`rounded-blade-xs border p-3 text-left ${
                    position === 0 ? 'border-ink bg-sky-100' : 'border-line bg-white'
                  }`}
                  onClick={() => {
                    void navigate({ to: ROUTES.ADMIN_MATCHING_RULE(match.id) });
                  }}
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-ink">{match.name}</span>
                    <Tag size="sm" tone={match.status === 'live' ? 'info' : 'neutral'}>
                      {match.status}
                    </Tag>
                    <Show when={position === 0}>
                      <span className="text-xs font-extrabold text-sky-on">would decide</span>
                    </Show>
                  </div>
                  <p className="text-xs text-ink-3">
                    {match.specificity} condition{match.specificity === 1 ? '' : 's'} matched
                    {match.branch !== null ? ` · branch: ${match.branch}` : ''}
                    {` · ${match.mode === 'boost' ? 'lifts' : 'serves'} ${String(match.meals.length)} meal${match.meals.length === 1 ? '' : 's'}`}
                  </p>
                </button>
              ))}
            </div>

            <Show when={matches.length > 1}>
              <p className="mt-3 text-xs text-ink-3">
                {matches.length - 1} other rule{matches.length - 1 === 1 ? '' : 's'} also match.
                The first wins on conditions matched, then priority, then whichever is newest.
              </p>
            </Show>

            {/* The line the user was explicit about. */}
            <p className="mt-3 text-xs text-ink-3">
              A rule decides which meal leads. The model still writes the sentence, so a
              curated answer reads exactly like a computed one.
            </p>
          </Show>
        </InfoCard>
      </div>
    </ConsoleShell>
  );
}
