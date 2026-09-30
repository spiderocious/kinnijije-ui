import { ENV } from '@shared/config/env';
import { EP } from '@shared/constants/endpoints';
import { apiClient } from '@shared/services/api-client';

import type { ChowdeckOffers, ChowdeckPlace } from './chowdeck.types';

/**
 * The three public Chowdeck endpoints. None of them sends a token, and none
 * needs one — this is used inside the anonymous decide flow.
 *
 * Only `offers` can ever cause a call to Chowdeck, and only on a cache miss
 * the server decides about. Place search is our own table; the redirect is a
 * lookup and a 302.
 */
export const chowdeckApi = {
  searchPlaces: (q: string): Promise<ChowdeckPlace[]> =>
    apiClient.get<ChowdeckPlace[]>(
      q.trim().length > 0 ? `${EP.CHOWDECK.PLACES}?${new URLSearchParams({ q: q.trim() }).toString()}` : EP.CHOWDECK.PLACES,
    ),

  offers: (input: { meal: string; place: string; mode: 'cook' | 'order' }): Promise<ChowdeckOffers> =>
    apiClient.get<ChowdeckOffers>(`${EP.CHOWDECK.OFFERS}?${new URLSearchParams(input).toString()}`),
};

/**
 * Where a tap goes: OUR redirect, never Chowdeck directly.
 *
 * A real link rather than a click handler that fetches, so it opens in a new
 * tab even with JavaScript busy, and so the server counts it even when an ad
 * blocker has stopped every analytics call in the page. The server builds the
 * destination from its own cache; nothing here can steer it.
 */
export function goHref(
  goPath: string,
  context: { meal: string; place: string; position: number; mode: 'cook' | 'order' },
): string {
  const url = new URL(`${ENV.API_BASE_URL}${EP.CHOWDECK.GO_BASE}${goPath}`);
  url.searchParams.set('meal', context.meal);
  url.searchParams.set('place', context.place);
  url.searchParams.set('pos', String(context.position));
  url.searchParams.set('mode', context.mode);
  return url.toString();
}
