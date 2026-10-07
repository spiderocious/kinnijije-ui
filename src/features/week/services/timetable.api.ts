import { EP } from '@shared/constants/endpoints';
import { apiClient } from '@shared/services/api-client';

/**
 * The timetable: the plan, generation, the runway and the swap editor.
 *
 * GUEST-FIRST. Every call carries `x-kj-guest-key` when nobody is signed in,
 * so a guest's plan persists across refreshes and is claimed on sign-up.
 * Planning a week is the most engaged thing somebody can do here; putting it
 * behind a sign-up wall would mean nobody discovers it.
 */

export type LineStatus = 'ok' | 'runs_out' | 'missing' | 'unknown';
export type MealSlotId = 'breakfast' | 'lunch' | 'dinner';

/**
 * The guest key, generated once and kept in localStorage.
 *
 * Not a security boundary: anybody holding the key can read that plan, which
 * is why a plan carries nothing but meal choices and a household size. It
 * exists so a refresh does not lose somebody's week.
 */
const GUEST_KEY_STORAGE = 'kj.timetable.guest';

export function guestKey(): string {
  try {
    const existing = window.localStorage.getItem(GUEST_KEY_STORAGE);
    if (existing !== null && existing.length > 0) return existing;

    const fresh = `g_${crypto.randomUUID().replace(/-/g, '')}`;
    window.localStorage.setItem(GUEST_KEY_STORAGE, fresh);
    return fresh;
  } catch {
    /**
     * Private mode, or storage blocked. A per-session key still works for the
     * current visit — the plan is simply not recoverable after a refresh,
     * which is better than refusing to plan at all.
     */
    return `g_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  }
}

/** Sent on every timetable call. Harmless when signed in: the server prefers the session. */
function guestHeaders(): Record<string, string> {
  return { 'x-kj-guest-key': guestKey() };
}

export interface KitchenLine {
  catalogueId: string | null;
  name: string;
  /** Null when somebody confirmed they have it but not how much. */
  quantity: number | null;
  unit: string | null;
  addedAt: string | null;
}

export interface RunwayLine {
  catalogueId: string | null;
  name: string;
  status: LineStatus;
  needed: number | null;
  have: number | null;
  unit: string | null;
  runsOutOn: string | null;
  shortfall: number | null;
  unknownReason: string | null;
  usedOn: string[];
}

export interface SpoilageWarning {
  catalogueId: string | null;
  name: string;
  /** Hedged in the copy: "likely past its best", never "spoiled". */
  likelyPastBestOn: string;
  neededOn: string | null;
}

export interface MarketLine {
  catalogueId: string | null;
  name: string;
  quantity: number;
  unit: string;
  /** An ESTIMATE. Null where the units would not convert — never a guess. */
  estimatedNgn: number | null;
}

export interface RunwaySummary {
  mealsPlanned: number;
  linesChecked: number;
  ok: number;
  short: number;
  /** How much of the answer could not be worked out. Shown, never hidden. */
  unknown: number;
}

export interface Runway {
  lines: RunwayLine[];
  spoilage: SpoilageWarning[];
  market: MarketLine[];
  estimatedTotalNgn: number | null;
  summary: RunwaySummary;
}

export interface PlannedMeal {
  mealId: string;
  mealName: string;
  slot: string;
}

export interface PlanDay {
  date: string;
  meals: PlannedMeal[];
}

export interface WeekPlan {
  id: string;
  weekOf: string;
  household: number;
  days: PlanDay[];
  kitchen: KitchenLine[];
  options: {
    days: number;
    startDate: string;
    slots: string[];
    budgetNgn: number | null;
    effortMinutes: number | null;
    repeats: string;
    /** Where the cook is, for the per-day weather line. Null means no line. */
    city?: string | null;
  } | null;
  remindEachMorning: boolean;
  /** True for a guest plan, so the UI can offer to keep it on sign-up. */
  isGuest: boolean;
  /**
   * Whether the plan is still being built, and how it was built.
   *
   * `pending` while the job runs, `ready` once it lands, `failed` when it
   * could not be built at all. The screen polls this rather than a job id —
   * see `generate` in this file for why.
   */
  generation: {
    status: 'idle' | 'pending' | 'ready' | 'failed';
    /** `ai` when the model composed it, `deterministic` when the matcher did. */
    strategy: 'ai' | 'deterministic' | null;
    error: string | null;
  };
  updatedAt: string;
}

/**
 * A planned meal with what the screen needs to DRAW it.
 *
 * The stored plan carries the id, the name and the slot — enough to rebuild
 * the week, not enough to render the design's slot card. The cook time, the
 * dish mark and whether the kitchen covers it come from the recipe on every
 * read, so an edited recipe is reflected immediately rather than frozen into
 * the plan at generation time.
 */
export interface PlannedMealView {
  mealId: string;
  mealName: string;
  slot: string;
  minutes: number | null;
  heroIcon: string | null;
  allInStock: boolean;
  missing: string[];
  /** This dish already appeared earlier in the plan. Derived on read. */
  leftover: boolean;
  /** The one-line reason under the dish name. Null means render no line. */
  reason: string | null;
}

export interface PlannedDayView {
  date: string;
  meals: PlannedMealView[];
  /** Null when the plan has no city, or the forecast lookup failed. */
  weather: { note: string; high: number | null; low: number | null; rain: boolean } | null;
}

/**
 * What `generate` returns: the work was accepted, not that it is finished.
 *
 * `plan_id` is the run to poll. Every generate creates its own plan, so "the
 * plan for this week" stops identifying anything the moment somebody
 * regenerates — polling by week showed the run that was just replaced.
 */
export interface GenerateAccepted {
  plan_id: string;
  week_of: string;
}

export interface TimetableSummary {
  plan: WeekPlan;
  /** The plan's days, enriched for rendering. */
  days: PlannedDayView[];
  runway: Runway;
  notes: string[];
}

export interface GeneratePayload {
  week_of?: string;
  days: number;
  start_date: string;
  slots: MealSlotId[];
  household: number;
  kitchen: {
    catalogue_id?: string | null;
    name: string;
    quantity?: number | null;
    unit?: string | null;
    added_at?: string | null;
  }[];
  budget_ngn?: number | null;
  effort_minutes?: number | null;
  repeats: 'never' | 'leftovers';
  /** The cook's city, for the per-day weather line. Null means no line. */
  city?: string | null;
}

export interface SwapCandidate {
  mealId: string;
  name: string;
  minutes: number;
  /** 0-100, from the deterministic matcher. Never model-derived. */
  matchPercent: number;
  missingCount: number;
  /** "have it all" or "need 1 thing". */
  kitchenNote: string;
  /** The recipe's glyph, so each candidate carries its own dish mark. */
  heroIcon: string | null;
}

export interface SwapOptions {
  candidates: SwapCandidate[];
  /** Stated BEFORE the swap, with the fix offered. */
  consequence: { spoils: { name: string; couldMoveTo: string | null } | null };
}

export const timetableApi = {
  /** Their stock, for the confirm screen. Empty for a guest. */
  kitchen: (): Promise<{ kitchen: KitchenLine[] }> =>
    apiClient.get<{ kitchen: KitchenLine[] }>(EP.TIMETABLE.KITCHEN, {
      headers: guestHeaders(),
    }),

  /**
   * The plan and its runway.
   *
   * `planId` pins an exact run, which is what the screen polls while a plan is
   * being built — without it, a regenerate would swap the answer underneath
   * somebody mid-wait. Omitting both returns the live plan.
   */
  summary: (weekOf?: string, planId?: string): Promise<TimetableSummary> => {
    const params = new URLSearchParams();
    if (weekOf !== undefined) params.set('week_of', weekOf);
    if (planId !== undefined) params.set('plan_id', planId);
    const query = params.toString();

    return apiClient.get<TimetableSummary>(
      `${EP.TIMETABLE.SUMMARY}${query === '' ? '' : `?${query}`}`,
      { headers: guestHeaders() },
    );
  },

  plan: (weekOf?: string): Promise<WeekPlan> =>
    apiClient.get<WeekPlan>(
      `${EP.TIMETABLE.PLAN}${weekOf === undefined ? '' : `?week_of=${weekOf}`}`,
      { headers: guestHeaders() },
    ),

  /** The Generate button. Returns the summary, so the client lands on the hub. */
  /**
   * Queues a plan. Returns as soon as the work is accepted, NOT when it is done.
   *
   * Building a week with a model takes six to fourteen seconds, so this no
   * longer waits for the result — the screen polls `summary()` and watches
   * `plan.generation.status` instead. No job id comes back: it is an internal
   * queue identifier and the endpoints that take one need a real session,
   * which this feature's guests do not have.
   */
  generate: (payload: GeneratePayload): Promise<GenerateAccepted> =>
    apiClient.post<GenerateAccepted>(EP.TIMETABLE.GENERATE, payload, {
      headers: guestHeaders(),
    }),

  /**
   * Refills one day. Returns the WHOLE summary, because changing a day
   * changes the runway — the shopping list and the per-meal chips are
   * computed across the plan.
   */
  regenerateDay: (payload: { week_of?: string; date: string }): Promise<TimetableSummary> =>
    apiClient.post<TimetableSummary>(EP.TIMETABLE.REGENERATE_DAY, payload, {
      headers: guestHeaders(),
    }),

  save: (payload: {
    week_of?: string;
    household?: number;
    days: { date: string; meals: { meal_id: string; meal_name: string; slot?: string }[] }[];
  }): Promise<WeekPlan> =>
    apiClient.put<WeekPlan>(EP.TIMETABLE.PLAN, payload, { headers: guestHeaders() }),

  setReminder: (on: boolean, weekOf?: string): Promise<void> =>
    apiClient.patch<void>(
      `${EP.TIMETABLE.REMINDER}${weekOf === undefined ? '' : `?week_of=${weekOf}`}`,
      { on },
      { headers: guestHeaders() },
    ),

  swapOptions: (params: {
    date: string;
    slot: MealSlotId;
    mealId?: string | null;
    weekOf?: string;
  }): Promise<SwapOptions> => {
    const query = new URLSearchParams({ date: params.date, slot: params.slot });
    if (params.mealId !== undefined && params.mealId !== null) {
      query.set('meal_id', params.mealId);
    }
    if (params.weekOf !== undefined) query.set('week_of', params.weekOf);

    return apiClient.get<SwapOptions>(`${EP.TIMETABLE.SWAP}?${query.toString()}`, {
      headers: guestHeaders(),
    });
  },

  /** Hands a guest's plans over after sign-in. */
  claim: (): Promise<{ claimed: number }> =>
    apiClient.post<{ claimed: number }>(EP.TIMETABLE.CLAIM, {}, { headers: guestHeaders() }),
};
