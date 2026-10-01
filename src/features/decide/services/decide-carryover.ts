import { EP } from '@shared/constants/endpoints';
import { apiClient } from '@shared/services/api-client';

import { decideDraft } from './decide-draft';
import type { DecideDraft, TimeBudget, Weight } from '../types/decide.types';

/**
 * Turning a guest's answers into an account's.
 *
 * Not a migration — a replay of three calls the app already makes, in the
 * order onboarding already makes them. Nothing here is a new endpoint.
 *
 * See docs/v2/system-design.html §10.
 */

/** 15 → easy · 40 → medium · 90 → anything. */
function difficultyFor(minutes: TimeBudget | null): 'easy' | 'medium' | 'anything' {
  if (minutes === 15) return 'easy';
  if (minutes === 90) return 'anything';
  return 'medium';
}

/**
 * A weight preference is a HINT at a cuisine, not a claim about one.
 *
 * Empty where there is nothing honest to map: "light" and "solid" say
 * something about the plate and nothing about the cuisine, and inventing a
 * preference the person never expressed is worse than carrying none.
 */
const CUISINE_HINTS: Readonly<Record<Weight, string[]>> = {
  solid: [],
  light: [],
  soupy: ['Nigerian'],
  swallow: ['Nigerian'],
  rice: ['Nigerian'],
  street: ['Nigerian'],
};

export interface CarryOverResult {
  /** True when the answers reached the account. */
  carried: boolean;
  /** The meal to land on, when the guest was holding one. */
  mealId: string | null;
}

/** Whether a draft holds anything worth carrying. A verdict is NOT required. */
export function hasAnswers(draft: DecideDraft | null): draft is DecideDraft {
  return (
    draft !== null &&
    (draft.kitchenItems.length > 0 || draft.mood !== null || draft.weight !== null || draft.verdict !== null)
  );
}

/**
 * Replays a draft onto a freshly-created account.
 *
 * BEST EFFORT on purpose. The account already exists by the time this runs, so
 * a failure here must never look like a failed signup — the draft is kept
 * rather than cleared.
 *
 * THE KITCHEN GOES INTO STOCK. It used to go only to onboarding's
 * `kitchen_items`, a list no screen reads — the Kitchen page and the decide
 * pre-fill both read stock — so a new member's kitchen looked empty and they
 * were asked for it all over again. `/stock/seed` is idempotent, so running
 * this twice cannot double anything.
 *
 * @param options.clearDraft whether to drop the browser draft afterwards.
 *   TRUE when the person is being taken somewhere else (their answers now live
 *   on the account). FALSE when they signed up INSIDE the flow and are still
 *   answering: clearing it there wiped their mood, weight and kitchen out from
 *   under the step they were standing on, so the next tap rebuilt an empty
 *   draft and bounced them back to the kitchen step with nothing ticked.
 */
export async function carryOverDraft(
  draft: DecideDraft | null,
  options: { clearDraft: boolean } = { clearDraft: true },
): Promise<CarryOverResult> {
  if (draft === null) return { carried: false, mealId: null };

  const mealId = draft.verdict?.verdict.meal_id ?? null;

  try {
    // First, and on its own: this is the part the person can SEE. If the
    // preferences below fail, their kitchen is still there.
    if (draft.kitchenItems.length > 0) {
      await apiClient.post(EP.STOCK.SEED, { names: draft.kitchenItems });
    }

    const payload: Record<string, unknown> = {
      difficulty: difficultyFor(draft.minutes),
    };
    if (draft.kitchenItems.length > 0) payload['kitchen_items'] = draft.kitchenItems;

    const cuisines = draft.weight === null ? [] : CUISINE_HINTS[draft.weight];
    if (cuisines.length > 0) payload['cuisines'] = cuisines;

    await apiClient.patch(EP.ONBOARDING.SAVE, payload);

    try {
      await apiClient.post(EP.ONBOARDING.COMPLETE);
    } catch {
      // A 409 means onboarding was already finished. The service's own comment
      // says a client should read that as "already done, carry on" — so it is
      // success, not a failure to retry.
    }

    // Only once the answers are safely on the account — and only when the
    // person is leaving the flow. See `clearDraft` above.
    if (options.clearDraft) decideDraft.clear();
    return { carried: true, mealId };
  } catch {
    // Kept for a retry. The account is real either way.
    return { carried: false, mealId };
  }
}

/** The city a guest gave, for the register form's own field. */
export function draftCity(draft: DecideDraft | null): string | undefined {
  const city = draft?.city?.trim();
  return city !== undefined && city.length > 0 ? city : undefined;
}
