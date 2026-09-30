import type { DecideOptions } from '../types/decide.types';

/**
 * The tiles, cached in the browser.
 *
 * These are 400+ ingredients that change when the catalogue changes — which is
 * rarely — so re-fetching them on every visit is waste on exactly the
 * connection this flow is used on.
 *
 * `localStorage` rather than `sessionStorage`, unlike the draft: this is public
 * reference data with nothing personal in it, so it SHOULD outlive the tab.
 *
 * Eviction is by payload fingerprint, never by hand. A stale copy is served
 * immediately and replaced the moment the server answers with a different
 * version, so the first paint never waits on the network.
 */

const KEY = 'kj.decide_options';

interface Cached {
  version: string;
  savedAt: number;
  options: DecideOptions;
}

/** A hard ceiling, so a forgotten cache cannot serve last year's catalogue. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const optionsCache = {
  read(): DecideOptions | null {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw === null) return null;

      const parsed = JSON.parse(raw) as Partial<Cached>;
      if (parsed.options === undefined || typeof parsed.version !== 'string') return null;
      if (Date.now() - (parsed.savedAt ?? 0) > MAX_AGE_MS) return null;
      // A payload written before `version` existed is not worth migrating.
      if (parsed.options.version !== parsed.version) return null;

      return parsed.options;
    } catch {
      // Storage throws outright in a private window; a miss is the right answer.
      return null;
    }
  },

  write(options: DecideOptions): void {
    try {
      const payload: Cached = { version: options.version, savedAt: Date.now(), options };
      window.localStorage.setItem(KEY, JSON.stringify(payload));
    } catch {
      // Quota or private mode. The app works without it, just less quickly.
    }
  },

  clear(): void {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      // Nothing to do.
    }
  },
};
