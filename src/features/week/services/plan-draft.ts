import { useCallback, useEffect, useState } from 'react';

import type { MealSlotId } from './timetable.api';

/**
 * The in-progress plan, surviving navigation.
 *
 * THE BUG THIS EXISTS TO FIX: every input stage held its answers in local
 * `useState`. Now that the stages are real routes, pressing back unmounts the
 * component — so somebody who picked eleven ingredients, moved on, then
 * pressed back to change one found an empty screen. Nothing was saved
 * anywhere, and the only recovery was to pick all eleven again.
 *
 * LOCAL STORAGE RATHER THAN A CONTEXT, deliberately. A context survives
 * navigation inside the app but not a reload, and planning a week is long
 * enough that people reload, follow a link out, or come back on their phone
 * an hour later. The draft is also not worth a round trip: it is answers to
 * two input screens, and the authoritative copy lands in the database the
 * moment they generate.
 *
 * SAFE WHEN STORAGE IS NOT. Every read and write is wrapped: private windows,
 * blocked site data and full quotas all throw, and the honest fallback is a
 * draft that lives for the session rather than a screen that will not render.
 */

const STORAGE_KEY = 'kj.timetable.draft';

/** What the input stages have answered so far. */
export interface PlanDraft {
  /**
   * The kitchen as LABELS, which is what the picker and the ranker both
   * speak — the catalogue id is resolved on confirm, for the lines that have
   * one. Storing labels means a draft stays readable across a catalogue merge
   * that renames ids.
   */
  kitchen: string[];
  /** True once they have been through the kitchen screen, even with nothing. */
  kitchenConfirmed: boolean;
  days: number;
  startDate: string;
  slots: MealSlotId[];
  household: number;
  budgetNgn: number | null;
  effortMinutes: number | null;
  repeats: 'never' | 'leftovers';
  /** Null means no weather line, which is a perfectly good plan. */
  city: string | null;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The defaults, matching the spec's "tap generate and we use sensible
 * defaults" — every row starts on a reasonable answer rather than empty.
 */
export function emptyDraft(): PlanDraft {
  return {
    kitchen: [],
    kitchenConfirmed: false,
    days: 7,
    startDate: today(),
    slots: ['lunch', 'dinner'],
    household: 2,
    budgetNgn: 12000,
    effortMinutes: 40,
    repeats: 'leftovers',
    city: null,
  };
}

/**
 * Reads a stored draft, field by field.
 *
 * Not a cast: a draft written by an older build has whatever shape that build
 * used, and trusting it wholesale would put `undefined` into fields the
 * screens index into. Each field is checked and falls back to its default, so
 * a draft from any past version degrades to a usable one.
 */
function parse(raw: string): PlanDraft {
  const base = emptyDraft();

  try {
    const value = JSON.parse(raw) as Partial<Record<keyof PlanDraft, unknown>>;

    return {
      kitchen: Array.isArray(value.kitchen)
        ? value.kitchen.filter((entry): entry is string => typeof entry === 'string')
        : base.kitchen,
      kitchenConfirmed:
        typeof value.kitchenConfirmed === 'boolean' ? value.kitchenConfirmed : base.kitchenConfirmed,
      days: typeof value.days === 'number' ? value.days : base.days,
      startDate: typeof value.startDate === 'string' ? value.startDate : base.startDate,
      slots: Array.isArray(value.slots)
        ? value.slots.filter(
            (entry): entry is MealSlotId =>
              entry === 'breakfast' || entry === 'lunch' || entry === 'dinner',
          )
        : base.slots,
      household: typeof value.household === 'number' ? value.household : base.household,
      budgetNgn: typeof value.budgetNgn === 'number' ? value.budgetNgn : null,
      effortMinutes: typeof value.effortMinutes === 'number' ? value.effortMinutes : null,
      repeats: value.repeats === 'never' ? 'never' : 'leftovers',
      city: typeof value.city === 'string' && value.city.length > 0 ? value.city : null,
    };
  } catch {
    return base;
  }
}

export function readDraft(): PlanDraft {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === null ? emptyDraft() : parse(raw);
  } catch {
    return emptyDraft();
  }
}

export function writeDraft(draft: PlanDraft): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // A draft that cannot be stored is not worth failing a screen over.
  }
}

/** Clears the draft. Called once a plan has been generated from it. */
export function clearDraft(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do: the draft is advisory.
  }
}

/**
 * The draft, as state that writes through on every change.
 *
 * Returns a patcher rather than a setter so a stage can save one field
 * without restating the rest — the kitchen screen knows about `kitchen` and
 * nothing else, and should not be able to clobber the configure answers by
 * writing a whole object.
 *
 * Reads once on mount via the initialiser, so a stage renders with the stored
 * answers already in place rather than flashing the defaults for a frame.
 */
export function usePlanDraft(): {
  draft: PlanDraft;
  patch: (changes: Partial<PlanDraft>) => void;
  reset: () => void;
} {
  const [draft, setDraft] = useState<PlanDraft>(readDraft);

  /**
   * Keeps two open tabs in step. Without this, planning in one tab and then
   * switching to the other shows the other tab's stale answers and the next
   * patch writes them back over the newer ones.
   */
  useEffect(() => {
    const onStorage = (event: StorageEvent): void => {
      if (event.key !== STORAGE_KEY) return;
      setDraft(event.newValue === null ? emptyDraft() : parse(event.newValue));
    };

    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  /**
   * Writes STRAIGHT TO STORAGE, then updates state.
   *
   * The write used to live inside the `setDraft` updater, which React is free
   * to defer and, in StrictMode, to run twice. That matters because the plan
   * screen reads the draft fresh from storage when it mounts: a value changed
   * and submitted in the same gesture has to be on disk before the next route
   * renders, or the plan is built from the previous answer.
   *
   * Reading the current value from storage rather than from `draft` keeps the
   * callback stable, so the effects that depend on it do not re-run.
   */
  const patch = useCallback((changes: Partial<PlanDraft>): void => {
    const next = { ...readDraft(), ...changes };
    writeDraft(next);
    setDraft(next);
  }, []);

  const reset = useCallback((): void => {
    clearDraft();
    setDraft(emptyDraft());
  }, []);

  return { draft, patch, reset };
}
