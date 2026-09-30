/**
 * Chowdeck, as the app sees it.
 *
 * Mirrors backend/src/features/chowdeck/chowdeck.offers.ts (`OfferView`) and
 * chowdeck.service.ts (`OffersView`). When one moves, both move.
 */

export interface ChowdeckPlace {
  id: string;
  /** "Surulere" — the chip. */
  name: string;
  /** "Surulere, Lagos, Nigeria" — the search result line. */
  description: string;
  city: string | null;
  /** The picker group. The server sends each state's main city first. */
  state: string | null;
}

export interface ChowdeckOffer {
  /** `${vendorId}:${productId}` — stable across refetches. */
  id: string;
  vendor: {
    id: string;
    name: string;
    area: string;
    logo_url: string | null;
    cover_url: string | null;
    rating: number | null;
    rating_count: number;
    delivery_fee_naira: number | null;
    delivery_minutes: { min: number; max: number } | null;
    distance_km: number | null;
    open_now: boolean;
    /** "8pm" when it opens later today. */
    opens_at: string | null;
  };
  product: {
    id: string;
    name: string;
    description: string | null;
    price_naira: number;
    price_description: string | null;
    image_url: string | null;
    more_count: number;
  };
  /** Relative to the API root. The browser adds meal, place, position and mode. */
  go_path: string;
}

/**
 *   ok          — at least one restaurant, open now or later today
 *   empty       — we asked; nobody there sells it that we can show
 *   unavailable — we could not ask and have nothing cached
 *   disabled    — switched off; render nothing at all
 */
export type OffersStatus = 'ok' | 'empty' | 'unavailable' | 'disabled';

export interface ChowdeckOffers {
  status: OffersStatus;
  served_from: 'fresh' | 'stale' | 'live' | 'fallback' | null;
  fetched_at: string | null;
  meal: { slug: string; name: string } | null;
  place: { id: string; name: string } | null;
  query: string | null;
  offers: ChowdeckOffer[];
  later: ChowdeckOffer[];
  considered: number;
}
