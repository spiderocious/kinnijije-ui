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
 * Tells our server a cook tapped through to Chowdeck.
 *
 * The link itself goes STRAIGHT to Chowdeck — our API never appears in the
 * address bar — and this report travels beside it. `keepalive` lets it finish
 * even as the page is left or backgrounded behind the new tab; it goes to our
 * own API rather than an analytics host, so an ad blocker does not stop it.
 *
 * Fire and forget: a failed report must never get in the way of the tap, so
 * every error is swallowed here.
 */
export function reportClick(input: {
  vendorId: string;
  productId: string;
  meal: string;
  place: string;
  position: number;
  mode: 'cook' | 'order';
}): void {
  try {
    void fetch(`${ENV.API_BASE_URL}${EP.CHOWDECK.CLICKS}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendor_id: input.vendorId,
        product_id: input.productId,
        meal: input.meal,
        place: input.place,
        position: input.position,
        mode: input.mode,
      }),
      keepalive: true,
      // Nothing about the person is needed to count a tap.
      credentials: 'omit',
    }).catch(() => undefined);
  } catch {
    // fetch itself can throw synchronously on a malformed URL; still never block the tap.
  }
}
