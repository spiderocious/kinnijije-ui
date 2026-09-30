/**
 * The steps of the flow, in order.
 *
 * Exported as a list because the URL carries the step, so an arriving value
 * has to be validated against something.
 */
export const DECIDE_STAGES = ['hero', 'kitchen', 'mood', 'weight', 'time', 'verdict'] as const;
export type DecideStage = (typeof DECIDE_STAGES)[number];

/**
 * The anonymous decision, client side.
 *
 * Mirrors backend/src/features/decide/decide.types.ts. When one moves, both
 * move in the same commit — a drifted shape here is a silent 422.
 */

export type Mood = 'tired' | 'fast' | 'proper' | 'comfort';
export type Weight = 'solid' | 'light' | 'soupy' | 'swallow' | 'rice' | 'street';
export type TimeBudget = 15 | 40 | 90;

export interface DecideMatch {
  score: number;
  have: string[];
  missing: string[];
  low: string[];
  /**
   * Staples the recipe wants that we assume are already there: salt, oil, a
   * stock cube. Shown, but never in the shopping list.
   */
  pantry: string[];
}

export interface DecideMeal {
  meal_id: string;
  slug: string;
  name: string;
  why: string;
  cook_time_minutes: number;
  difficulty: 'easy' | 'medium' | 'involved';
  serves: number;
  match: DecideMatch;
  hero_icon: string | null;
  tags: string[];
}

/** Where the words came from. Drives the grape provenance mark. */
export type DecideProvenance = 'ai_framed' | 'deterministic';

export interface DecideVerdict {
  verdict: DecideMeal;
  alternates: DecideMeal[];
  /**
   * The rest of the shortlist. Held so "not this" and "change an answer"
   * re-rank locally and cost NOTHING — the model call already happened.
   */
  pool: DecideMeal[];
  framing: string | null;
  provenance: DecideProvenance;
  notes?: { summary?: string; warnings?: string[] };
}

export interface DecideOptionTile {
  id: string;
  label: string;
  icon: string;
  catalogue_id?: string;
  /** The names a cook actually types — "atarodo", "gari". Searched locally. */
  aliases?: string[];
}

export interface DecideOptions {
  /** The whole catalogue, grouped — 400+ items, not a curated subset. */
  kitchen: Array<{ id: string; label: string; items: DecideOptionTile[] }>;
  /** How many groups to show before "More groups". */
  primary_group_count: number;
  moods: DecideOptionTile[];
  weights: DecideOptionTile[];
  minutes: Array<{ value: TimeBudget; label: string }>;
  cities: string[];
  captions: {
    moods: Record<string, string>;
    weights: Record<string, string>;
  };
  /** Payload fingerprint. The local cache keys on it, so edits evict it. */
  version: string;
  total_items: number;
}

/**
 * Everything a guest has told us, held in their own browser.
 *
 * `sessionStorage`, not `localStorage`: a taste draft must not outlive the
 * tab. A shared laptop should never greet the next person with somebody
 * else's mood. (Tokens are the opposite case, which is why session-store.ts
 * uses localStorage.)
 */
export interface DecideDraft {
  /** Shape version. A bump discards an incompatible older draft. */
  v: 1;
  startedAt: string;
  kitchenItems: string[];
  /** [] with skipped=true is "I have nothing", which is a real answer. */
  kitchenSkipped: boolean;
  mood: Mood | null;
  weight: Weight | null;
  minutes: TimeBudget | null;
  city: string | null;
  /** Meals refused this session. Sent back so they are never offered again. */
  rejected: string[];
  /** The answer, once given. Held so a reload costs no second model call. */
  verdict: DecideVerdict | null;
}

export interface DecidePayload {
  kitchen_items: string[];
  kitchen_skipped: boolean;
  mood: Mood;
  weight: Weight;
  minutes: TimeBudget;
  city?: string;
  rejected: string[];
}

/**
 * The counters on the front door.
 *
 * Derived from real activity server-side and scaled before they are sent, so
 * they move when usage moves. `as_of` lets the client keep drifting from where
 * the snapshot was taken rather than restarting on every reload.
 */
export interface DecideStats {
  meals_decided: number;
  decided_today: number;
  meals_cooked: number;
  refresh_in_seconds: number;
  as_of: string;
}
