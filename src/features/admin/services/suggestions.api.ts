import { EP } from '@shared/constants/endpoints';

import { staffClient } from './staff-client';

/**
 * Dishes the composing planner proposed that we do not have a recipe for.
 *
 * The other half of the deal the inverted planner makes: it invents plates
 * and they reach cooks immediately with the model's own steps, so somebody
 * has to decide which of them are worth making real.
 */

export interface SuggestionRow {
  id: string;
  name: string;
  kind: 'adapt' | 'invent';
  basedOnMealId: string | null;
  why: string;
  /** Ingredient names, resolved from catalogue ids by the server. */
  uses: string[];
  /** The plate broken into parts — base, sauce, protein, side, drink. */
  parts: { name: string; role: string }[];
  /** 1-5, how filling. The model's own judgement. */
  substance: number | null;
  steps: string[];
  minutes: number | null;
  /** How often this has come up. The queue sorts on it. */
  timesSuggested: number;
  status: 'new' | 'promoted' | 'rejected';
  /** The draft recipe this became, so the row can link straight to it. */
  promotedMealId: string | null;
  createdAt: string;
}

export const adminSuggestionsApi = {
  list: (
    params: { status?: SuggestionRow['status']; limit?: number } = {},
  ): Promise<{ suggestions: SuggestionRow[]; total: number }> => {
    const query = new URLSearchParams();
    if (params.status !== undefined) query.set('status', params.status);
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    const qs = query.toString();

    return staffClient.get<{ suggestions: SuggestionRow[]; total: number }>(
      `${EP.ADMIN_SUGGESTIONS.LIST}${qs === '' ? '' : `?${qs}`}`,
    );
  },

  /** Creates a DRAFT recipe. Returns the meal id so the screen can link to it. */
  promote: (suggestionId: string): Promise<{ mealId: string; alreadyPromoted: boolean }> =>
    staffClient.post<{ mealId: string; alreadyPromoted: boolean }>(
      EP.ADMIN_SUGGESTIONS.PROMOTE(suggestionId),
      {},
    ),

  reject: (suggestionId: string): Promise<null> =>
    staffClient.post<null>(EP.ADMIN_SUGGESTIONS.REJECT(suggestionId), {}),
};
