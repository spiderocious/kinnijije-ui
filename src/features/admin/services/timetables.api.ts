import { EP } from '@shared/constants/endpoints';

import { staffClient } from './staff-client';

/**
 * Timetable observability.
 *
 * Read-only: a plan belongs to the cook who made it, and the console's
 * business is whether the feature works — not what somebody is having for
 * dinner.
 */

export interface TimetableUsage {
  plans: number;
  guestPlans: number;
  signedInPlans: number;
  /** Rows created but never generated into. The drop-off number. */
  abandoned: number;
  remindersOn: number;
  byDays: { days: number; count: number }[];
  byHousehold: { household: number; count: number }[];
  medianMeals: number;
  window: { from: string; to: string };
}

export interface TimetableQuality {
  fullyCovered: number;
  withShortfall: number;
  /** Plans where something could not be worked out. The number to watch. */
  withUnknowns: number;
  totalUnknownLines: number;
  averageMarketNgn: number | null;
  sampled: number;
}

export interface TimetableRow {
  id: string;
  ownerId: string | null;
  isGuest: boolean;
  weekOf: string;
  household: number;
  days: number;
  meals: number;
  kitchenSize: number;
  remindEachMorning: boolean;
  /**
   * How it was built.
   *
   * `ai` appears only on plans made before the strategies were split apart
   * and means `candidates`. Null for plans made before any model was involved.
   */
  strategy: 'compose' | 'candidates' | 'deterministic' | 'ai' | null;
  /** Which planner was ASKED for, so a fallback reads as a fallback. */
  requestedStrategy: 'compose' | 'candidates' | 'deterministic' | null;
  /**
   * How the composed plates matched our catalogue.
   *
   * A plan that is all `none` is a week of untested model recipes, which is a
   * different product from the one we think we are shipping.
   */
  matching: { exact: number; close: number; none: number } | null;
  /** `pending` while still being built, so a stuck job is visible here. */
  generationStatus: 'idle' | 'pending' | 'ready' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface TimetableDetail extends TimetableRow {
  plan: { date: string; meals: { mealId: string; mealName: string; slot: string }[] }[];
  kitchen: { name: string; quantity: number | null; unit: string | null }[];
  options: {
    days: number;
    startDate: string;
    slots: string[];
    budgetNgn: number | null;
    effortMinutes: number | null;
    repeats: string;
  } | null;
  runway: {
    lines: {
      name: string;
      status: 'ok' | 'runs_out' | 'missing' | 'unknown';
      runsOutOn: string | null;
      unknownReason: string | null;
    }[];
    market: { name: string; quantity: number; unit: string; estimatedNgn: number | null }[];
    estimatedTotalNgn: number | null;
    summary: {
      mealsPlanned: number;
      linesChecked: number;
      ok: number;
      short: number;
      unknown: number;
    };
  } | null;
}

/**
 * Which planner builds a week.
 *
 * `compose`       the model composes complete plates, we match them to our
 *                 catalogue afterwards. The default, and the only one that
 *                 can answer "what should I eat" rather than "which of our
 *                 rows is closest".
 * `candidates`    we rank our catalogue and the model arranges the rows.
 * `deterministic` no model at all.
 */
export type PlannerStrategy = 'compose' | 'candidates' | 'deterministic';

export interface StrategyComparison {
  windowDays: number;
  rows: {
    /** Grouped by what was ASKED for, so a fallback is visible as one. */
    strategy: string;
    plans: number;
    avgMealsPerPlan: number;
    /** Distinct ingredients a plan needed that its kitchen did not have. */
    avgToBuy: number;
    /** Percentage that fell back to a different planner than requested. */
    fallbackRate: number;
    matchedExact: number;
    matchedClose: number;
    matchedNone: number;
    avgDurationMs: number;
  }[];
}

export const adminTimetablesApi = {
  usage: (days?: number): Promise<TimetableUsage> =>
    staffClient.get<TimetableUsage>(
      `${EP.ADMIN_TIMETABLES.USAGE}${days === undefined ? '' : `?days=${String(days)}`}`,
    ),

  quality: (days?: number): Promise<TimetableQuality> =>
    staffClient.get<TimetableQuality>(
      `${EP.ADMIN_TIMETABLES.QUALITY}${days === undefined ? '' : `?days=${String(days)}`}`,
    ),

  list: (params: { guestsOnly?: boolean; limit?: number } = {}): Promise<{
    plans: TimetableRow[];
    total: number;
  }> => {
    const query = new URLSearchParams();
    if (params.guestsOnly !== undefined) query.set('guests_only', String(params.guestsOnly));
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    const qs = query.toString();

    return staffClient.get<{ plans: TimetableRow[]; total: number }>(
      `${EP.ADMIN_TIMETABLES.LIST}${qs === '' ? '' : `?${qs}`}`,
    );
  },

  detail: (planId: string): Promise<TimetableDetail> =>
    staffClient.get<TimetableDetail>(EP.ADMIN_TIMETABLES.DETAIL(planId)),

  /** Which planner builds a week, and the alternatives. */
  strategy: (): Promise<{ strategy: PlannerStrategy; options: PlannerStrategy[] }> =>
    staffClient.get<{ strategy: PlannerStrategy; options: PlannerStrategy[] }>(
      EP.ADMIN_TIMETABLES.STRATEGY,
    ),

  /** Switches the planner for everybody. */
  setStrategy: (strategy: PlannerStrategy): Promise<{ strategy: PlannerStrategy }> =>
    staffClient.put<{ strategy: PlannerStrategy }>(EP.ADMIN_TIMETABLES.STRATEGY, { strategy }),

  /** How the strategies compare on real plans. */
  compare: (days?: number): Promise<StrategyComparison> =>
    staffClient.get<StrategyComparison>(
      `${EP.ADMIN_TIMETABLES.COMPARE}${days === undefined ? '' : `?days=${String(days)}`}`,
    ),
};
