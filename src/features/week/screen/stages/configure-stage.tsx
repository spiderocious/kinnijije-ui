import { useState } from 'react';

import { Show } from 'meemaw';

import { KoboyoIcon, Plus } from '@icons';
import { NumberPanel } from '@ui/inputs';

import {
  PlanAppBar,
  PlanBody,
  PlanButton,
  PlanDock,
  PlanLabel,
  PlanNote,
  PlanOptions,
  PlanPill,
  PlanScreen,
} from '../../parts/plan-chrome';

/**
 * Frame 01 — Configure.
 *
 * ONE PATTERN, EVERY NUMERIC ROW: common presets, then a `+` pill in the same
 * shape. Tapping `+` opens the number panel; a submitted value JOINS the row
 * as a selected pill and the `+` stays put. Custom values persist for the
 * session's edits, so coming back here does not lose the 10 you typed.
 *
 * Nothing is required. The spec is explicit: "Tap generate and we use sensible
 * defaults" — so every row starts on a reasonable answer rather than empty.
 *
 * Sliders are deliberately gone. Presets plus the panel are both more precise
 * and less fiddly than dragging.
 */

export type MealSlotId = 'breakfast' | 'lunch' | 'dinner';

export interface ConfigureValues {
  days: number;
  startDate: string;
  slots: MealSlotId[];
  household: number;
  budgetNgn: number | null;
  effortMinutes: number | null;
  repeats: 'never' | 'leftovers';
  /**
   * Where the cook is, for the per-day weather line.
   *
   * On the plan rather than the profile: somebody planning a week from their
   * village at Christmas wants that week's weather, not their Lagos address.
   * Null means no weather line, which is a perfectly good plan.
   */
  city: string | null;
}

/**
 * The cities offered, with "somewhere else" as free text.
 *
 * A short list rather than a search: the geocoder upstream takes anything, so
 * this is purely about the common case being one tap. Ordered by population,
 * which is as good a proxy for "likely" as anything.
 */
const CITY_PRESETS = ['Lagos', 'Abuja', 'Ibadan', 'Port Harcourt', 'Kano'] as const;

const DAY_PRESETS = [3, 7, 14] as const;
const HOUSEHOLD_PRESETS = [1, 2, 4, 6] as const;
const BUDGET_PRESETS = [null, 5000, 12000] as const;
const EFFORT_PRESETS = [20, 40, null] as const;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function tomorrow(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function naira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

export function ConfigureStage({
  initial,
  pending,
  onChange,
  onBack,
  onGenerate,
}: {
  readonly initial: ConfigureValues;
  readonly pending: boolean;
  /**
   * Reports every change as it happens, so the route can persist it.
   *
   * Live rather than on submit: this screen is a route, and somebody who sets
   * the household to six then presses back to fix their kitchen must find six
   * still set when they come forward again.
   */
  readonly onChange: (values: ConfigureValues) => void;
  readonly onBack: () => void;
  readonly onGenerate: (values: ConfigureValues) => void;
}) {
  const [values, setValues] = useState<ConfigureValues>(initial);

  /**
   * Custom values the panel produced, kept so they stay in the row.
   *
   * Held separately from the selection because the spec requires the submitted
   * value to JOIN the row — it becomes a fourth pill beside the presets, and
   * going back to configure must not lose it.
   */
  const [customDays, setCustomDays] = useState<number | null>(null);
  const [customHousehold, setCustomHousehold] = useState<number | null>(null);
  const [customBudget, setCustomBudget] = useState<number | null>(null);
  const [customEffort, setCustomEffort] = useState<number | null>(null);
  const [customDate, setCustomDate] = useState<string | null>(null);
  const [customCity, setCustomCity] = useState<string | null>(
    // A city restored from the draft that is not a preset belongs in the row.
    initial.city !== null && !CITY_PRESETS.includes(initial.city as 'Lagos') ? initial.city : null,
  );
  const [cityOpen, setCityOpen] = useState(false);

  /** Updates and reports in one move, so nothing can change without persisting. */
  const patch = (next: Partial<ConfigureValues>): void => {
    setValues((current) => {
      const updated = { ...current, ...next };
      onChange(updated);
      return updated;
    });
  };

  const toggleSlot = (slot: MealSlotId): void => {
    const has = values.slots.includes(slot);
    // Never empty: a plan with no meals in it is not a plan, and the Generate
    // button would have nothing to fill.
    if (has && values.slots.length === 1) return;

    patch({
      slots: has ? values.slots.filter((entry) => entry !== slot) : [...values.slots, slot],
    });
  };

  return (
    <PlanScreen>
      <PlanAppBar title="Plan your meals" onBack={onBack} />

      <PlanBody>
        <PlanNote tone="ok">
          <strong>Nothing here is required.</strong> Tap generate and we use sensible defaults.
        </PlanNote>

        {/* ── How many days ───────────────────────────────────────── */}
        <div>
          <PlanLabel>How many days</PlanLabel>
          <PlanOptions>
            {DAY_PRESETS.map((days) => (
              <PlanPill
                key={days}
                active={values.days === days}
                onClick={() => {
                  patch({ days });
                }}
              >
                {days}
              </PlanPill>
            ))}
            {/* The custom value joins the row. The `+` never moves. */}
            <Show when={customDays !== null && !DAY_PRESETS.includes(customDays as 3)}>
              <PlanPill
                active={values.days === customDays}
                onClick={() => {
                  if (customDays !== null) patch({ days: customDays });
                }}
              >
                {customDays}
              </PlanPill>
            </Show>
            <PlanPill
              plus
              ariaLabel="Enter another number"
              onClick={() => {
                void NumberPanel.ask({
                  title: 'How many days',
                  hint: 'Up to 21',
                  value: values.days,
                  min: 1,
                  max: 21,
                  format: 'integer',
                  unit: 'days',
                }).then((answer) => {
                  if (answer === null) return;
                  setCustomDays(answer);
                  patch({ days: answer });
                });
              }}
            >
              <Plus size={13} strokeWidth={2.8} />
            </PlanPill>
          </PlanOptions>
        </div>

        {/* ── Starting ────────────────────────────────────────────── */}
        <div>
          <PlanLabel>Starting</PlanLabel>
          <PlanOptions>
            <PlanPill
              active={values.startDate === today()}
              onClick={() => {
                patch({ startDate: today() });
              }}
            >
              Today
            </PlanPill>
            <PlanPill
              active={values.startDate === tomorrow()}
              onClick={() => {
                patch({ startDate: tomorrow() });
              }}
            >
              Tomorrow
            </PlanPill>
            {/*
             * A DATE PICKER, not the number panel — a date is not a quantity.
             * The native input is the right control here: it is the one place
             * the OS picker genuinely beats anything custom, and it also sets
             * which real weather we can read.
             */}
            <label
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-pill border-2 px-[11px] py-[5px] text-[11.5px] font-extrabold transition-all duration-fast ${
                customDate !== null && values.startDate === customDate
                  ? 'border-ink bg-sky text-white shadow-drop-sm'
                  : 'border-line-2 bg-white text-ink-2 hover:border-ink'
              }`}
            >
              <KoboyoIcon name="calendarCircledDate" size={13} alone />
              {customDate !== null && values.startDate === customDate ? customDate : 'Pick a date'}
              <input
                type="date"
                value={values.startDate}
                min={today()}
                onChange={(event) => {
                  setCustomDate(event.target.value);
                  patch({ startDate: event.target.value });
                }}
                className="sr-only"
              />
            </label>
          </PlanOptions>
        </div>

        {/* ── Which meals ─────────────────────────────────────────── */}
        <div>
          <PlanLabel>Which meals</PlanLabel>
          <PlanOptions>
            {(['breakfast', 'lunch', 'dinner'] as const).map((slot) => (
              <PlanPill
                key={slot}
                active={values.slots.includes(slot)}
                onClick={() => {
                  toggleSlot(slot);
                }}
              >
                {slot.charAt(0).toUpperCase() + slot.slice(1)}
              </PlanPill>
            ))}
          </PlanOptions>
        </div>

        {/* ── Cooking for ─────────────────────────────────────────── */}
        <div>
          <PlanLabel>Cooking for</PlanLabel>
          <PlanOptions>
            {HOUSEHOLD_PRESETS.map((count) => (
              <PlanPill
                key={count}
                active={values.household === count}
                onClick={() => {
                  patch({ household: count });
                }}
              >
                {count}
              </PlanPill>
            ))}
            <Show
              when={customHousehold !== null && !HOUSEHOLD_PRESETS.includes(customHousehold as 1)}
            >
              <PlanPill
                active={values.household === customHousehold}
                onClick={() => {
                  if (customHousehold !== null) patch({ household: customHousehold });
                }}
              >
                {customHousehold}
              </PlanPill>
            </Show>
            <PlanPill
              plus
              ariaLabel="Enter another number"
              onClick={() => {
                void NumberPanel.ask({
                  title: 'Cooking for',
                  hint: 'How many plates per meal',
                  value: values.household,
                  min: 1,
                  max: 20,
                  format: 'integer',
                  unit: 'people',
                }).then((answer) => {
                  if (answer === null) return;
                  setCustomHousehold(answer);
                  patch({ household: answer });
                });
              }}
            >
              <Plus size={13} strokeWidth={2.8} />
            </PlanPill>
          </PlanOptions>
        </div>

        {/* ── Shopping budget ─────────────────────────────────────── */}
        <div>
          <PlanLabel>Shopping budget</PlanLabel>
          <PlanOptions>
            {BUDGET_PRESETS.map((amount) => (
              <PlanPill
                key={amount ?? 'nothing'}
                active={values.budgetNgn === amount}
                onClick={() => {
                  patch({ budgetNgn: amount });
                }}
              >
                {amount === null ? 'Nothing' : naira(amount)}
              </PlanPill>
            ))}
            <Show
              when={
                customBudget !== null &&
                !BUDGET_PRESETS.includes(customBudget as 5000)
              }
            >
              <PlanPill
                active={values.budgetNgn === customBudget}
                onClick={() => {
                  patch({ budgetNgn: customBudget });
                }}
              >
                {naira(customBudget ?? 0)}
              </PlanPill>
            </Show>
            <PlanPill
              plus
              ariaLabel="Enter an amount"
              onClick={() => {
                void NumberPanel.ask({
                  title: 'Shopping budget',
                  hint: 'For the whole week',
                  value: values.budgetNgn,
                  min: 0,
                  max: 200000,
                  step: 500,
                  format: 'currency',
                  currency: 'NGN',
                }).then((answer) => {
                  if (answer === null) return;
                  setCustomBudget(answer);
                  patch({ budgetNgn: answer });
                });
              }}
            >
              <Plus size={13} strokeWidth={2.8} />
            </PlanPill>
          </PlanOptions>
        </div>

        {/* ── Weeknight effort ────────────────────────────────────── */}
        <div>
          <PlanLabel>Weeknight effort</PlanLabel>
          <PlanOptions>
            {EFFORT_PRESETS.map((minutes) => (
              <PlanPill
                key={minutes ?? 'anything'}
                active={values.effortMinutes === minutes}
                onClick={() => {
                  patch({ effortMinutes: minutes });
                }}
              >
                {minutes === null
                  ? 'Anything'
                  : minutes === 20
                    ? 'Under 20 min'
                    : `Under ${String(minutes)}`}
              </PlanPill>
            ))}
            <Show
              when={customEffort !== null && !EFFORT_PRESETS.includes(customEffort as 20)}
            >
              <PlanPill
                active={values.effortMinutes === customEffort}
                onClick={() => {
                  patch({ effortMinutes: customEffort });
                }}
              >
                Under {customEffort}
              </PlanPill>
            </Show>
            <PlanPill
              plus
              ariaLabel="Enter minutes"
              onClick={() => {
                void NumberPanel.ask({
                  title: 'Weeknight effort',
                  hint: 'The longest a weeknight cook should take',
                  value: values.effortMinutes ?? 40,
                  min: 5,
                  max: 240,
                  format: 'integer',
                  unit: 'minutes',
                }).then((answer) => {
                  if (answer === null) return;
                  setCustomEffort(answer);
                  patch({ effortMinutes: answer });
                });
              }}
            >
              <Plus size={13} strokeWidth={2.8} />
            </PlanPill>
          </PlanOptions>
        </div>

        {/* ── Repeats ─────────────────────────────────────────────── */}
        <div>
          <PlanLabel>Repeats</PlanLabel>
          <PlanOptions>
            <PlanPill
              active={values.repeats === 'never'}
              onClick={() => {
                patch({ repeats: 'never' });
              }}
            >
              Never repeat
            </PlanPill>
            <PlanPill
              active={values.repeats === 'leftovers'}
              onClick={() => {
                patch({ repeats: 'leftovers' });
              }}
            >
              Leftovers are fine
            </PlanPill>
          </PlanOptions>
        </div>

        {/* ── Where you are ───────────────────────────────────────── */}
        <div>
          <PlanLabel>Where you are</PlanLabel>
          <PlanOptions>
            <PlanPill
              active={values.city === null}
              onClick={() => {
                patch({ city: null });
              }}
            >
              Skip
            </PlanPill>
            {CITY_PRESETS.map((city) => (
              <PlanPill
                key={city}
                active={values.city === city}
                onClick={() => {
                  patch({ city });
                }}
              >
                {city}
              </PlanPill>
            ))}
            {/* Somewhere not on the list. The geocoder takes anything. */}
            <Show when={customCity !== null && !CITY_PRESETS.includes(customCity as 'Lagos')}>
              <PlanPill
                active={values.city === customCity}
                onClick={() => {
                  patch({ city: customCity });
                }}
              >
                {customCity}
              </PlanPill>
            </Show>
            <Show
              when={cityOpen}
              fallback={
                <PlanPill
                  plus
                  ariaLabel="Type another town"
                  onClick={() => {
                    setCityOpen(true);
                  }}
                >
                  <Plus size={13} strokeWidth={2.8} />
                </PlanPill>
              }
            >
              {/*
               * Typed in place rather than in a panel: a town name is one
               * short string, and the number panel is for quantities.
               */}
              <span className="inline-flex items-center gap-1.5 rounded-pill border-2 border-ink bg-white px-[11px] py-[5px]">
                <input
                  type="text"
                  aria-label="Your town"
                  placeholder="Your town"
                  defaultValue={customCity ?? ''}
                  onBlur={(event) => {
                    const typed = event.target.value.trim();
                    setCityOpen(false);
                    if (typed.length === 0) return;
                    setCustomCity(typed);
                    patch({ city: typed });
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === 'Escape') {
                      event.currentTarget.blur();
                    }
                  }}
                  ref={(node) => {
                    node?.focus();
                  }}
                  className="w-[88px] bg-transparent text-[11.5px] font-extrabold text-ink outline-none placeholder:font-bold placeholder:text-ink-4"
                />
              </span>
            </Show>
          </PlanOptions>
          <p className="mt-1.5 text-[11.5px] text-ink-3">
            Only used for the weather line on each day. Skip it and the plan is the same.
          </p>
        </div>
      </PlanBody>

      <PlanDock>
        <PlanButton
          loading={pending}
          onClick={() => {
            onGenerate(values);
          }}
        >
          {pending ? 'Building your week…' : 'Generate'}
        </PlanButton>
        {/* Stated, not hidden: macros are excluded by the PRD and this says so
            rather than leaving somebody hunting for the setting. */}
        <PlanButton variant="quiet" onClick={() => undefined}>
          Health goals — coming later
        </PlanButton>
      </PlanDock>
    </PlanScreen>
  );
}
