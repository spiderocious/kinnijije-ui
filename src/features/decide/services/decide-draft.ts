import type { DecideDraft, DecideVerdict, Mood, TimeBudget, Weight } from '../types/decide.types';

/**
 * Where a guest's answers live between steps.
 *
 * `sessionStorage` on purpose — see DecideDraft's own note. Every read and
 * write is guarded exactly as `session-store.ts` guards its own: storage
 * throws outright in a private window on some browsers, and an unguarded
 * getter here would take down the whole flow on boot.
 */

const KEY = 'kj.decide_draft';

/** Client-side cap, re-validated at 40 by the server's Zod schema. */
export const MAX_KITCHEN_ITEMS = 40;
/** Matches the server. A refusal list longer than this is not a real session. */
const MAX_REJECTED = 20;

export function emptyDraft(): DecideDraft {
  return {
    v: 1,
    startedAt: new Date().toISOString(),
    kitchenItems: [],
    kitchenSkipped: false,
    mood: null,
    weight: null,
    minutes: null,
    city: null,
    mode: 'cook',
    place: null,
    rejected: [],
    verdict: null,
  };
}

function read(): string | null {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function write(value: string): void {
  try {
    window.sessionStorage.setItem(KEY, value);
  } catch {
    // Storage unavailable — the draft simply will not survive a reload, and
    // the flow still works within the page.
  }
}

export const decideDraft = {
  /**
   * The draft, or null when there is none.
   *
   * A draft of a different shape version is discarded rather than migrated:
   * it is one session's worth of taps, and guessing at an old shape risks
   * sending nonsense to the decide endpoint.
   */
  get(): DecideDraft | null {
    const raw = read();
    if (raw === null) return null;

    try {
      const parsed = JSON.parse(raw) as Partial<DecideDraft>;
      if (parsed.v !== 1) return null;
      return { ...emptyDraft(), ...parsed, v: 1 };
    } catch {
      return null;
    }
  },

  /** The draft, creating one if this is the first tap. */
  ensure(): DecideDraft {
    const existing = decideDraft.get();
    if (existing !== null) return existing;
    const fresh = emptyDraft();
    write(JSON.stringify(fresh));
    return fresh;
  },

  /**
   * Writes one step's answers.
   *
   * Only the keys passed are touched, mirroring `OnboardingService.save`'s
   * $set-only-what-was-sent discipline: a step that collects a mood must not
   * be able to blank the kitchen a previous step filled.
   */
  patch(changes: Partial<DecideDraft>): DecideDraft {
    const next: DecideDraft = { ...decideDraft.ensure(), ...changes, v: 1 };

    if (next.kitchenItems.length > MAX_KITCHEN_ITEMS) {
      next.kitchenItems = next.kitchenItems.slice(0, MAX_KITCHEN_ITEMS);
    }
    if (next.rejected.length > MAX_REJECTED) {
      // Keep the most recent refusals: an old one matters less than what they
      // just said no to.
      next.rejected = next.rejected.slice(-MAX_REJECTED);
    }

    write(JSON.stringify(next));
    return next;
  },

  clear(): void {
    try {
      window.sessionStorage.removeItem(KEY);
    } catch {
      // Nothing to do.
    }
  },
};

/** True once the two required answers are in. */
export function isDecidable(draft: DecideDraft): draft is DecideDraft & {
  mood: Mood;
  weight: Weight;
} {
  return draft.mood !== null && draft.weight !== null;
}

/** The server defaults this too; sending it explicitly keeps the two in step. */
export const DEFAULT_MINUTES: TimeBudget = 40;

export function draftToPayload(draft: DecideDraft & { mood: Mood; weight: Weight }) {
  // A picked place carries its own city; a typed one only exists in cook mode
  // with the Chowdeck flag off.
  const city = (draft.place?.city ?? draft.city)?.trim();
  const ordering = draft.mode === 'order';
  return {
    // Ordering sends an empty kitchen: the server ignores it in that mode, and
    // sending the taps anyway would log a kitchen the person set aside.
    kitchen_items: ordering ? [] : draft.kitchenItems,
    kitchen_skipped: ordering ? true : draft.kitchenSkipped,
    mood: draft.mood,
    weight: draft.weight,
    minutes: draft.minutes ?? DEFAULT_MINUTES,
    ...(city !== undefined && city.length > 0 && { city }),
    mode: draft.mode,
    ...(draft.place !== null && { place_id: draft.place.id }),
    rejected: draft.rejected,
  };
}

/** Order mode cannot decide without a place: there is nowhere to look for restaurants. */
export function isReadyToDecide(draft: DecideDraft): boolean {
  return isDecidable(draft) && (draft.mode !== 'order' || draft.place !== null);
}

/** Records a refusal and drops the stale verdict in one write. */
export function rejectMeal(mealId: string): DecideDraft {
  const draft = decideDraft.ensure();
  const rejected = draft.rejected.includes(mealId)
    ? draft.rejected
    : [...draft.rejected, mealId];
  return decideDraft.patch({ rejected, verdict: null });
}

export function storeVerdict(verdict: DecideVerdict): DecideDraft {
  return decideDraft.patch({ verdict });
}
