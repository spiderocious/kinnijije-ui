/** Mirrors backend/src/features/chowdeck/chowdeck.admin.service.ts. */

export type CallKind = 'autocomplete' | 'search';
export type CallTrigger = 'user' | 'admin' | 'job' | 'replay';
export type CallStatus =
  | 'ok'
  | 'http_error'
  | 'timeout'
  | 'network_error'
  | 'parse_error'
  | 'refused';
export type RefusalReason = 'fetch_disabled' | 'breaker_open' | 'daily_cap' | 'rate_limited';

export type CacheStatus = 'ok' | 'empty';
export type Freshness = 'fresh' | 'stale' | 'expired';

export const CALL_KINDS: readonly CallKind[] = ['autocomplete', 'search'];
export const CALL_TRIGGERS: readonly CallTrigger[] = ['user', 'admin', 'job', 'replay'];
export const CALL_STATUSES: readonly CallStatus[] = [
  'ok',
  'http_error',
  'timeout',
  'network_error',
  'parse_error',
  'refused',
];

/** The two switches, as the feature-flag endpoint names them. */
export const CHOWDECK_FLAGS = {
  OFFERS: 'chowdeck_offers',
  FETCH: 'chowdeck_fetch',
} as const;

// ── Overview ─────────────────────────────────────────────────────────
export interface GuardState {
  fetch_enabled: boolean;
  breaker: {
    open: boolean;
    open_until: string | null;
    consecutive_failures: number;
    threshold: number;
    last_failure_at: string | null;
    last_error: string | null;
  };
  today: { sent: number; cap: number };
  per_minute: number;
  timeout_ms: number;
  in_flight: number;
}

export interface ClickCount {
  key: string | null;
  count: number;
}

export interface ChowdeckOverview {
  flags: { offers: boolean; fetch: boolean };
  guards: GuardState;
  settings: {
    fresh_hours: number;
    stale_max_hours: number;
    empty_fresh_hours: number;
    call_log_ttl_days: number;
    api_base: string;
    web_base: string;
  };
  places: { total: number; active: number };
  cache: { entries: number; by_status: Record<string, number>; hits: number };
  /** In-memory counters on the server: they reset on every restart. */
  served: {
    since: string;
    counts: { fresh: number; stale: number; live: number; fallback: number; unavailable: number };
  };
  calls_24h: {
    total: number;
    by_status: Record<string, number>;
    by_trigger: Record<string, number>;
    p50_ms: number | null;
    p95_ms: number | null;
  };
  recent_failures: CallRow[];
  clicks_7d: {
    total: number;
    by_meal: ClickCount[];
    by_vendor: ClickCount[];
    by_place: ClickCount[];
    by_mode: ClickCount[];
  };
}

// ── The request log ──────────────────────────────────────────────────
export interface CallRow {
  id: string;
  kind: CallKind;
  trigger: CallTrigger;
  actor_id: string | null;
  url: string;
  params: Record<string, string>;
  status: CallStatus;
  http_status: number | null;
  duration_ms: number;
  result_count: number | null;
  error: string | null;
  /** ECONNREFUSED, ENOTFOUND, TIMEOUT… — why there was no answer at all. */
  error_code: string | null;
  /** Their Retry-After header, when they sent one. Its presence on a 429 settles "is it really a rate limit". */
  retry_after: string | null;
  response_bytes: number | null;
  truncated: boolean;
  replay_of: string | null;
  request_id: string | null;
  created_at: string | null;
}

export interface CallDetail extends CallRow {
  /** Exactly what we sent. Empty for a refused call, which was never sent. */
  request_headers: Record<string, string>;
  /** Every header they sent back. Null when no response arrived at all. */
  response_headers: Record<string, string> | null;
  /** Exactly as received, cut off past the storage cap. */
  response_body: string | null;
  /** The same body parsed. Null when truncated or not JSON. */
  response_json: unknown;
  cache_entry_id: string | null;
  replays: CallRow[];
}

/** What a call that just happened reports back. */
export interface CallOutcome {
  call_id: string;
  status: CallStatus;
  http_status: number | null;
  duration_ms: number;
  error: string | null;
  refusal: RefusalReason | null;
}

export interface ReplayResult {
  call: CallOutcome;
  /** Only on a replayed search. */
  cache_updated?: boolean;
}

// ── Cache ────────────────────────────────────────────────────────────
export interface CacheRow {
  id: string;
  key: string;
  place_id: string;
  place_name: string | null;
  query: string;
  meal_slug: string | null;
  status: CacheStatus;
  freshness: Freshness;
  vendor_count: number;
  raw_vendor_count: number;
  dropped_vendor_count: number;
  hits: number;
  last_served_at: string | null;
  fetched_at: string | null;
  call_id: string;
}

export interface StoredHours {
  opening: string | null;
  closing: string | null;
  isOpen: boolean;
}

export interface StoredProduct {
  productId: string;
  name: string;
  description: string | null;
  /** Kobo, exactly as Chowdeck sent it. */
  priceKobo: number;
  priceDescription: string | null;
  inStock: boolean;
  imageUrl: string | null;
}

/** The stored vendor. Camel-cased: it is the database shape, sent as is. */
export interface StoredVendor {
  vendorId: string;
  name: string;
  slug: string;
  area: string;
  logoUrl: string | null;
  coverUrl: string | null;
  rating: number | null;
  ratingCount: number;
  deliveryFeeKobo: number | null;
  minDeliveryMinutes: number | null;
  maxDeliveryMinutes: number | null;
  distanceKm: number | null;
  hours: Record<string, StoredHours>;
  temporarilyUnavailable: boolean;
  unavailableReason: string | null;
  openAtFetch: boolean | null;
  products: StoredProduct[];
  store_url: string;
}

/** One offer exactly as a cook sees it. */
export interface OfferView {
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
  go_path: string;
}

export interface CacheDetail extends Omit<CacheRow, 'vendor_count'> {
  vendors: StoredVendor[];
  as_served_now: { open: OfferView[]; later: OfferView[]; considered: number };
}

export interface RefreshResult {
  call: CallOutcome;
  updated: boolean;
}

export type ClearScope = 'entry' | 'place' | 'query' | 'all';

// ── Coverage ─────────────────────────────────────────────────────────
export interface CoverageCell {
  id: string;
  place_id: string;
  meal_slug: string;
  status: CacheStatus;
  freshness: Freshness;
  vendors: number;
  open_now: number;
  later: number;
  fetched_at: string | null;
}

export interface Coverage {
  meals: { slug: string; name: string }[];
  places: { id: string; name: string; city: string | null }[];
  cells: CoverageCell[];
}

export interface FetchAheadInput {
  meal_slugs: string[];
  place_ids: string[];
  force: boolean;
}

export interface FetchAheadResult {
  job_id: string;
  pairs: number;
  /** More pairs matched than one run will fetch. */
  capped: boolean;
}

// ── Places ───────────────────────────────────────────────────────────
export interface PlaceRow {
  id: string;
  name: string;
  description: string;
  secondary: string | null;
  city: string | null;
  /** The picker group. */
  state: string | null;
  /** Position in the default list; the lowest per state is its main city. */
  rank: number;
  types: string[];
  active: boolean;
  searched_with: string | null;
  added_by: string | null;
  cached_searches: number;
  cached_with_results: number;
  created_at: string | null;
}

export interface PlaceList {
  items: PlaceRow[];
  total: number;
  /** How many places "Import default places" would look up. */
  seed_list_size: number;
}

export interface Prediction {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string | null;
  types: string[];
  saved: boolean;
}

export interface AutocompleteResult {
  call: CallOutcome;
  predictions: Prediction[];
}

export interface SavePlaceInput {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text?: string | null;
  types?: string[];
  city?: string | null;
  searched_with?: string | null;
}

export interface UpdatePlaceInput {
  active?: boolean;
  city?: string | null;
  name?: string;
}

// ── Clicks ───────────────────────────────────────────────────────────
export interface ClickRow {
  id: string;
  vendor_id: string;
  vendor_name: string;
  product_id: string | null;
  meal_slug: string | null;
  place_id: string | null;
  position: number | null;
  mode: string | null;
  url: string;
  created_at: string | null;
}
