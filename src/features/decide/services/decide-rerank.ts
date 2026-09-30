import type { DecideMeal, DecideVerdict } from '../types/decide.types';

/**
 * Local re-ranking — the free half of the flow.
 *
 * The decide response carries the whole ranked shortlist, not just the winner,
 * so "not this", "something else" and "change an answer" are arithmetic over
 * objects already in the browser. They spend NO model call, which is what lets
 * the public endpoint's 8/hour budget be generous with a real person while
 * staying useless to a scraper.
 *
 * Deliberately dependency-free: pure functions over plain data, so they are
 * testable without a DOM, a query client or a router.
 */

/** Every meal in a verdict, winner first, de-duplicated. */
export function allMeals(verdict: DecideVerdict): DecideMeal[] {
  const seen = new Set<string>();
  return [verdict.verdict, ...verdict.alternates, ...verdict.pool].filter((meal) => {
    if (seen.has(meal.meal_id)) return false;
    seen.add(meal.meal_id);
    return true;
  });
}

/**
 * Moves one meal into the hero slot.
 *
 * The promoted meal keeps its OWN templated `why`, and provenance drops to
 * `deterministic`. The model wrote one sentence about one dish; showing it
 * above a different meal would be a confident lie about this person's kitchen,
 * so the grape provenance mark has to come off with it.
 */
export function promote(verdict: DecideVerdict, mealId: string): DecideVerdict {
  const all = allMeals(verdict);
  const next = all.find((meal) => meal.meal_id === mealId);
  if (next === undefined) return verdict;

  const rest = all.filter((meal) => meal.meal_id !== mealId);

  return {
    ...verdict,
    verdict: next,
    alternates: rest.slice(0, 2),
    pool: rest,
    provenance: 'deterministic',
  };
}

/**
 * Drops one meal and promotes whatever is next.
 *
 * Returns null when the shortlist is exhausted — the caller then says so and
 * offers to widen a filter, which is the only thing that can actually help.
 */
export function rejectAndPromote(verdict: DecideVerdict, mealId: string): DecideVerdict | null {
  const rest = allMeals(verdict).filter((meal) => meal.meal_id !== mealId);
  const next = rest[0];
  if (next === undefined) return null;

  return {
    ...verdict,
    verdict: next,
    alternates: rest.slice(1, 3),
    pool: rest.slice(1),
    provenance: 'deterministic',
  };
}
