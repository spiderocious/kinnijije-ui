import { useState } from 'react';

import { useNavigate, useSearch } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { DrawerService } from '@ui/drawer';

import { useRegenerateDay, useSavePlan, useSwapOptions } from '../../hooks/use-timetable';
import { DaySkeleton } from '../../parts/plan-skeletons';
import { SwapSheet } from '../../parts/swap-sheet';
import type { MealSlotId, TimetableSummary } from '../../services/timetable.api';
import { DayByDayStage } from '../stages/day-by-day-stage';
import { PlanGate } from './plan-gate';

/**
 * `/timetable/days?day=N` — day by day, with the swap sheet.
 *
 * THE DAY IS IN THE URL. It was component state, so pressing back on Thursday
 * left the feature entirely rather than stepping to Wednesday. Paging through
 * a week is navigation and should behave like it — including being linkable
 * and surviving a reload.
 *
 * The swap sheet stays in component state rather than becoming a sixth route.
 * It is an overlay on this screen, not a destination.
 */
export default function TimetableDaysRoute() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { day?: number };

  return (
    <PlanGate title="Day by day" skeleton={<DaySkeleton />}>
      {(summary) => <Days summary={summary} navigate={navigate} day={search.day ?? 1} />}
    </PlanGate>
  );
}

function Days({
  summary,
  navigate,
  day,
}: {
  readonly summary: TimetableSummary;
  readonly navigate: ReturnType<typeof useNavigate>;
  /** One-based, from `?day=`. User-facing, and the screen says "Day 2 of 7". */
  readonly day: number;
}) {
  const savePlan = useSavePlan();
  const swapOptions = useSwapOptions();
  const regenerate = useRegenerateDay();

  /**
   * Clamped, because the URL is user-editable and a plan can shrink.
   * `?day=99` on a 7-day plan opens the last day rather than a blank screen.
   */
  const index = Math.min(Math.max(day - 1, 0), Math.max(summary.days.length - 1, 0));
  const [swapping, setSwapping] = useState<{
    date: string;
    slot: MealSlotId;
    mealId: string | null;
  } | null>(null);

  /** Replaces one slot's dish, then saves the whole week. */
  const replaceSlot = (date: string, slot: MealSlotId, mealId: string, mealName: string): void => {
    savePlan.mutate({
      week_of: summary.plan.weekOf,
      days: summary.plan.days.map((day) =>
        day.date !== date
          ? { date: day.date, meals: day.meals.map(toWire) }
          : {
              date: day.date,
              meals: day.meals.map((meal) =>
                meal.slot === slot ? { meal_id: mealId, meal_name: mealName, slot } : toWire(meal),
              ),
            },
      ),
    });
  };

  const removeSlot = (date: string, slot: MealSlotId): void => {
    savePlan.mutate({
      week_of: summary.plan.weekOf,
      days: summary.plan.days.map((day) =>
        day.date !== date
          ? { date: day.date, meals: day.meals.map(toWire) }
          : { date: day.date, meals: day.meals.filter((meal) => meal.slot !== slot).map(toWire) },
      ),
    });
  };

  return (
    <>
      <DayByDayStage
        summary={summary}
        index={index}
        onIndexChange={(next) => {
          /*
           * PUSH, not replace: each day is a history entry, which is the
           * whole point — back steps a day instead of leaving the feature.
           */
          void navigate({
            to: ROUTES.TIMETABLE_DAYS,
            search: { day: next + 1 },
          });
        }}
        regenerating={regenerate.isPending}
        onBack={() => {
          void navigate({ to: ROUTES.TIMETABLE_PLAN });
        }}
        onOpenSlotMenu={(date, slot, mealId) => {
          setSwapping({ date, slot, mealId });
          swapOptions.mutate({ date, slot, mealId, weekOf: summary.plan.weekOf });
        }}
        onAddMeal={(date) => {
          // An empty slot: the same sheet, with nothing to replace.
          setSwapping({ date, slot: 'dinner', mealId: null });
          swapOptions.mutate({ date, slot: 'dinner', weekOf: summary.plan.weekOf });
        }}
        onRegenerateDay={(date) => {
          /*
           * A REAL REGENERATE now. It used to toast "regenerate the whole
           * plan from Edit", which threw away six good days to change one.
           * The backend refills this day against the same kitchen and steers
           * away from what the other days already use.
           */
          regenerate.mutate(
            { date, week_of: summary.plan.weekOf },
            {
              onError: (failure) => {
                DrawerService.toast(failure.message, { tone: 'critical' });
              },
            },
          );
        }}
      />

      <Show when={swapping !== null}>
        <SwapSheet
          dayLabel={new Date(`${swapping?.date ?? ''}T00:00:00.000Z`).toLocaleDateString('en-NG', {
            timeZone: 'UTC',
            weekday: 'long',
          })}
          slotName={swapping?.slot ?? ''}
          currentDish={
            summary.plan.days
              .find((day) => day.date === swapping?.date)
              ?.meals.find((meal) => meal.slot === swapping?.slot)?.mealName ?? null
          }
          options={swapOptions.data}
          loading={swapOptions.isPending}
          onPick={(mealId, mealName) => {
            if (swapping === null) return;
            replaceSlot(swapping.date, swapping.slot, mealId, mealName);
            setSwapping(null);
          }}
          onRemove={() => {
            if (swapping === null) return;
            removeSlot(swapping.date, swapping.slot);
            setSwapping(null);
          }}
          onSurpriseMe={() => {
            const first = swapOptions.data?.candidates[0];
            if (swapping === null || first === undefined) return;
            replaceSlot(swapping.date, swapping.slot, first.mealId, first.name);
            setSwapping(null);
          }}
          onClose={() => {
            setSwapping(null);
          }}
        />
      </Show>
    </>
  );
}

/** Plan meal → wire shape. */
function toWire(meal: { mealId: string; mealName: string; slot: string }): {
  meal_id: string;
  meal_name: string;
  slot: string;
} {
  return { meal_id: meal.mealId, meal_name: meal.mealName, slot: meal.slot };
}
