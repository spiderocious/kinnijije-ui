import { useState } from 'react';

import { Show } from 'meemaw';

import { ChevronDown, ChevronLeft, ChevronRight, KoboyoIcon } from '@icons';

import {
  PlanAppBar,
  PlanBody,
  PlanDock,
  PlanNote,
  PlanScreen,
  PlanTag,
} from '../../parts/plan-chrome';
import { PlanAddSlot, PlanSlot } from '../../parts/plan-slot';
import type { MealSlotId, TimetableSummary } from '../../services/timetable.api';

/**
 * Frame 03 — day by day, with the jump list (04) and swap sheet (05).
 *
 * THE TITLE BAR IS THE JUMP CONTROL. Tapping "Tuesday 2 Oct" opens the day
 * list — discoverable without a second icon competing for the corner.
 *
 * TWO SCOPES, TWO CONTROLS: the per-slot menu swaps or removes one meal; the
 * app bar's regenerate redoes the whole day. Never one button doing both.
 *
 * "A day is a column, not a slot": a real Tuesday can have three meals, so the
 * day renders a list plus an "Add a meal" control rather than fixed boxes.
 */

function longDate(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString('en-NG', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}

function weekdayName(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString('en-NG', {
    timeZone: 'UTC',
    weekday: 'long',
  });
}

function shortWeekday(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString('en-NG', {
    timeZone: 'UTC',
    weekday: 'short',
  });
}

function dayNumber(date: string): string {
  return String(new Date(`${date}T00:00:00.000Z`).getUTCDate());
}

export function DayByDayStage({
  summary,
  index,
  onIndexChange,
  onBack,
  onOpenSlotMenu,
  onAddMeal,
  onRegenerateDay,
  regenerating,
}: {
  readonly summary: TimetableSummary;
  /**
   * Which day, OWNED BY THE ROUTE and held in the URL as `?day=`.
   *
   * It was `useState` here, which meant pressing back on Thursday left the
   * feature entirely instead of stepping to Wednesday. Paging is navigation.
   */
  readonly index: number;
  readonly onIndexChange: (next: number) => void;
  readonly onBack: () => void;
  readonly onOpenSlotMenu: (date: string, slot: MealSlotId, mealId: string) => void;
  readonly onAddMeal: (date: string) => void;
  readonly onRegenerateDay: (date: string) => void;
  /** True while this day is being refilled, so the dock can say so. */
  readonly regenerating: boolean;
}) {
  /**
   * The ENRICHED days, not `plan.days`.
   *
   * The stored plan carries only the id, the name and the slot. The design's
   * slot card needs the cook time, the dish mark and whether the kitchen
   * covers THAT meal — all of which the summary derives from the recipes on
   * every read, so an edited recipe shows through immediately.
   */
  const days = summary.days;
  const [jumpOpen, setJumpOpen] = useState(false);

  const day = days[index];
  if (day === undefined) {
    return (
      <PlanScreen>
        <PlanAppBar title="Your week" onBack={onBack} />
        <PlanBody>
          <PlanNote>Nothing planned yet.</PlanNote>
        </PlanBody>
      </PlanScreen>
    );
  }

  /**
   * Which lines are a problem ON THIS DAY.
   *
   * Scoped to the day rather than the week, because "rice runs out Thursday"
   * is not Tuesday's problem and showing it on every day makes it noise.
   */
  const trouble = summary.runway.lines.filter(
    (line) =>
      line.usedOn.includes(day.date) && (line.status === 'runs_out' || line.status === 'missing'),
  );

  /**
   * A one-word tag per day for the jump list, so it doubles as a health check.
   *
   * Only two states now that the countdown and spoilage are off: this day
   * needs something bought, or it does not.
   */
  const tagFor = (date: string): { label: string; tone: 'ok' | 'warn' } => {
    const toBuy = summary.runway.lines.filter(
      (line) => line.usedOn.includes(date) && line.status !== 'ok',
    );

    return toBuy.length === 0
      ? { label: 'ok', tone: 'ok' }
      : { label: `${String(toBuy.length)} to buy`, tone: 'warn' };
  };

  return (
    <PlanScreen>
      <PlanAppBar
        onBack={onBack}
        title={
          /* The title IS the jump control. */
          <button
            type="button"
            onClick={() => {
              setJumpOpen(true);
            }}
            className="flex items-center gap-1.5 font-display text-[15px] font-extrabold text-ink hover:text-sky-deep"
          >
            <span>{longDate(day.date)}</span>
            <ChevronDown size={13} strokeWidth={2.6} className="text-ink-3" />
          </button>
        }
        /*
         * NO REGENERATE ICON HERE any more.
         *
         * It used to sit top-right and only produce a toast telling people to
         * regenerate the whole plan from Edit — a control that refused to do
         * its own job. Regenerating this day is now a real action and it lives
         * in the dock, where the thumb already is.
         */
      />

      <PlanBody>
        {/* `.dayhead` — position in the plan, plus the dot strip. */}
        <div className="flex items-center gap-2.5">
          <div>
            <div className="font-mono text-[10.5px] font-semibold text-ink-4">
              Day {index + 1} of {days.length}
            </div>
            <div className="font-display text-[21px] font-extrabold tracking-display text-ink">
              {weekdayName(day.date)}
            </div>
          </div>
          <div className="ml-auto flex gap-1">
            {days.map((entry, position) => (
              <button
                key={entry.date}
                type="button"
                aria-label={longDate(entry.date)}
                onClick={() => {
                  onIndexChange(position);
                }}
                className={`h-1.5 rounded-pill transition-all duration-fast ${
                  position === index ? 'w-[17px] bg-sky' : 'w-1.5 bg-line-2'
                }`}
              />
            ))}
          </div>
        </div>

        {/*
         * `.wk` — the weather line, per day.
         *
         * Stated plainly and only when we have it: null means the plan has no
         * city on it, or the lookup failed. Weather is a nudge in this product
         * and never the deciding factor, so an absent line costs nothing.
         */}
        <Show when={day.weather !== null}>
          <div className="flex items-center gap-2 rounded-blade-xs border border-hair border-line-2 bg-sky-soft px-[11px] py-2">
            {/* `cloud` and `sun` are the two glyphs the set actually has —
                there is no rain glyph, and an unknown name renders blank. */}
            <KoboyoIcon
              name={day.weather?.rain === true ? 'cloud' : 'sun'}
              size={15}
              alone
              className="flex-none text-sky-deep"
            />
            {/*
             * THE FORECAST, AND NOTHING ELSE.
             *
             * This used to append "Soups suit it." or "Good day for a grill."
             * off the `rain` boolean — advice that was identical on every wet
             * day and had nothing to do with what was actually planned. A
             * rainy Tuesday holding fried yam still read "Soups suit it",
             * which claims the weather shaped the food when it did not.
             *
             * The planner is told to mention weather in a slot's own reason
             * when it genuinely influenced the choice, and that line sits on
             * the dish where it can be true. This one states the forecast.
             */}
            <span className="text-[11.5px] text-ink-2">{day.weather?.note}</span>
          </div>
        </Show>

        {/*
         * What this day needs that they do not have.
         *
         * No spoilage line and no depletion warning: both needed data most
         * kitchens do not carry, so both are switched off. What is left is
         * the one thing somebody can act on before cooking.
         */}
        <Show when={trouble.length > 0}>
          <PlanNote tone="warn">
            <strong>
              {trouble.length} thing{trouble.length === 1 ? '' : 's'} to buy for today.
            </strong>{' '}
            {trouble.map((line) => line.name).join(', ')}.
          </PlanNote>
        </Show>

        {day.meals.map((meal) => (
          <PlanSlot
            key={`${meal.slot}-${meal.mealId}`}
            slotName={meal.slot}
            minutes={meal.minutes}
            dishName={meal.mealName}
            heroIcon={meal.heroIcon}
            /*
             * The line under the dish name, as the design has it. Null when
             * there is nothing worth saying, and the slot then renders no
             * line rather than filler.
             */
            reason={meal.reason}
            /*
             * Scoped to THIS MEAL, not the day.
             *
             * It used to count every short line used anywhere on the day,
             * which meant a dish you had everything for still read "3 to
             * buy" because the other dish was short. The summary now says
             * per meal what it is missing.
             *
             * The `leftover` chip joins it, matching the design's pair of
             * chips — "all in stock" and "leftover" say different things and
             * a cook wants both.
             */
            tags={[
              ...(meal.allInStock
                ? [{ label: 'all in stock', tone: 'ok' as const }]
                : [
                    {
                      label: `${String(meal.missing.length)} to buy`,
                      tone: 'warn' as const,
                    },
                  ]),
              ...(meal.leftover ? [{ label: 'leftover', tone: 'neutral' as const }] : []),
            ]}
            onMenu={() => {
              onOpenSlotMenu(day.date, meal.slot as MealSlotId, meal.mealId);
            }}
          />
        ))}

        <PlanAddSlot
          dayName={weekdayName(day.date)}
          onClick={() => {
            onAddMeal(day.date);
          }}
        />
      </PlanBody>

      {/* The dock is the day pager. Swipe is the primary gesture; these are
          the reachable equivalent, because a pager you cannot tap is a pager
          somebody with one hand full cannot use. */}
      <PlanDock>
        <div className="flex gap-[7px]">
          <button
            type="button"
            disabled={index === 0}
            aria-label="Previous day"
            onClick={() => {
              onIndexChange(index - 1);
            }}
            className="grid h-9 w-11 flex-none place-items-center rounded-blade-xs border-2 border-line-2 bg-white text-ink disabled:opacity-40"
          >
            <ChevronLeft size={15} strokeWidth={2.4} />
          </button>
          {/*
           * THE PRIMARY ACTION IS REGENERATE THIS DAY.
           *
           * It was "Cook the <dish>", which duplicated what tapping the slot
           * already does. The useful thing to do while looking at one day is
           * to change it — and changing just this day, against the same
           * kitchen, leaving the other six alone, is what people actually
           * want when a Tuesday does not appeal.
           */}
          <button
            type="button"
            disabled={regenerating}
            onClick={() => {
              onRegenerateDay(day.date);
            }}
            className="flex flex-1 items-center justify-center gap-1.5 truncate rounded-blade-xs border-2 border-ink bg-sky px-3 text-[12.5px] font-extrabold text-white shadow-drop-sm disabled:border-line-2 disabled:bg-paper-2 disabled:text-ink-3 disabled:shadow-none"
          >
            <KoboyoIcon
              name="cycle"
              size={14}
              alone
              className={regenerating ? 'animate-spin' : undefined}
            />
            {regenerating ? 'Finding other dishes…' : `Regenerate ${weekdayName(day.date)}`}
          </button>
          <button
            type="button"
            disabled={index >= days.length - 1}
            aria-label="Next day"
            onClick={() => {
              onIndexChange(index + 1);
            }}
            className="grid h-9 w-11 flex-none place-items-center rounded-blade-xs border-2 border-line-2 bg-white text-ink disabled:opacity-40"
          >
            <ChevronRight size={15} strokeWidth={2.4} />
          </button>
        </div>
      </PlanDock>

      {/* ── Frame 04: jump to a day ──────────────────────────────── */}
      <Show when={jumpOpen}>
        <div
          className="fixed inset-0 z-modal flex items-end justify-center bg-scrim"
          onClick={() => {
            setJumpOpen(false);
          }}
          role="presentation"
        >
          <div
            className="max-h-[88%] w-full max-w-[520px] overflow-y-auto rounded-t-blade border-t-bold border-ink bg-white px-3.5 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-[15px]"
            onClick={(event) => {
              event.stopPropagation();
            }}
            role="dialog"
            aria-label="Jump to a day"
          >
            <div className="mx-auto mb-[13px] h-1 w-10 rounded-pill bg-line-2" />
            <div className="mb-[11px] font-display text-base font-extrabold text-ink">
              Jump to a day
            </div>

            <div className="flex flex-col gap-[7px]">
              {days.map((entry, position) => {
                const tag = tagFor(entry.date);
                const current = position === index;

                return (
                  <button
                    key={entry.date}
                    type="button"
                    onClick={() => {
                      onIndexChange(position);
                      setJumpOpen(false);
                    }}
                    className={`flex items-center gap-2.5 rounded-blade-xs border px-2.5 py-2 text-left transition-all duration-fast ${
                      current
                        ? 'border-sky bg-sky-soft shadow-drop-sm'
                        : 'border-hair border-line-2 bg-white hover:border-ink'
                    }`}
                  >
                    <span className="w-[30px] flex-none font-mono text-[10px] font-semibold text-ink-4">
                      {shortWeekday(entry.date)}
                      <em className="block font-display text-[15px] font-extrabold not-italic text-ink">
                        {dayNumber(entry.date)}
                      </em>
                    </span>
                    <span className="flex-1 text-[11.5px] font-bold leading-[1.3] text-ink-2">
                      {entry.meals.map((meal) => meal.mealName).join(' · ') || 'Nothing planned'}
                    </span>
                    <PlanTag tone={tag.tone}>{tag.label}</PlanTag>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                setJumpOpen(false);
              }}
              className="mt-3 w-full rounded-blade-xs border-2 border-line-2 bg-white py-2.5 text-[14.5px] font-extrabold text-ink hover:border-ink hover:bg-paper-2"
            >
              Back to the day
            </button>
          </div>
        </div>
      </Show>
    </PlanScreen>
  );
}
