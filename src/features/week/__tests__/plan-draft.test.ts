import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { clearDraft, emptyDraft, readDraft, writeDraft } from '../services/plan-draft';

/**
 * The in-progress plan's persistence.
 *
 * THE BUG THIS PROTECTS AGAINST, reported from a real session: "the
 * ingredients seems not to be saved, as when i back to the ingredient page, i
 * cant see what i selected anymore". Every input stage held its answers in
 * component state, and making the stages real routes meant navigation
 * unmounted them — so pressing back to change one ingredient showed an empty
 * screen with no way to recover eleven picks.
 *
 * The other half of the risk is the READ: a draft written by an older build
 * has whatever shape that build used, and trusting it wholesale would put
 * `undefined` into fields the screens index into. Every field is checked, so
 * any past or corrupt draft degrades to a usable one rather than a crash.
 */

/** A minimal localStorage, since this runs under node rather than a browser. */
function fakeStorage(): Storage {
  const map = new Map<string, string>();

  return {
    get length() {
      return map.size;
    },
    clear: () => {
      map.clear();
    },
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => {
      map.delete(key);
    },
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

const KEY = 'kj.timetable.draft';

beforeEach(() => {
  globalThis.window = { localStorage: fakeStorage() } as unknown as Window & typeof globalThis;
});

describe('the plan draft survives navigation', () => {
  it('reads back what was written', () => {
    writeDraft({ ...emptyDraft(), kitchen: ['Rice', 'Beans', 'Tomatoes'] });

    assert.deepEqual(readDraft().kitchen, ['Rice', 'Beans', 'Tomatoes']);
  });

  it('keeps the configure answers alongside the kitchen', () => {
    writeDraft({
      ...emptyDraft(),
      kitchen: ['Rice'],
      household: 6,
      days: 14,
      city: 'Ibadan',
      repeats: 'never',
    });

    const draft = readDraft();
    assert.equal(draft.household, 6);
    assert.equal(draft.days, 14);
    assert.equal(draft.city, 'Ibadan');
    assert.equal(draft.repeats, 'never');
    assert.deepEqual(draft.kitchen, ['Rice']);
  });

  it('starts from the defaults when nothing is stored', () => {
    const draft = readDraft();

    assert.deepEqual(draft.kitchen, []);
    assert.equal(draft.kitchenConfirmed, false);
    assert.equal(draft.days, 7);
    assert.deepEqual(draft.slots, ['lunch', 'dinner']);
    assert.equal(draft.city, null);
  });

  it('clears', () => {
    writeDraft({ ...emptyDraft(), kitchen: ['Rice'] });
    clearDraft();

    assert.deepEqual(readDraft().kitchen, []);
  });

  /**
   * `kitchenConfirmed` is what stops the kitchen screen re-seeding from stock.
   * Without it, a signed-in cook who took three things out and pressed back
   * would have them pushed straight back in.
   */
  it('remembers that the kitchen screen has been passed', () => {
    writeDraft({ ...emptyDraft(), kitchen: [], kitchenConfirmed: true });

    const draft = readDraft();
    assert.equal(draft.kitchenConfirmed, true);
    assert.deepEqual(draft.kitchen, [], 'an empty confirmed kitchen is a real answer');
  });
});

describe('a stored draft is never trusted wholesale', () => {
  it('survives junk in the slot', () => {
    window.localStorage.setItem(KEY, 'not json at all {{{');

    assert.deepEqual(readDraft(), emptyDraft());
  });

  it('drops a kitchen that is not an array of strings', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ kitchen: [1, null, 'Rice', {}] }));

    assert.deepEqual(readDraft().kitchen, ['Rice']);
  });

  it('falls back on fields an older build never wrote', () => {
    // A draft from before `city` and `kitchenConfirmed` existed.
    window.localStorage.setItem(KEY, JSON.stringify({ kitchen: ['Rice'], household: 4 }));

    const draft = readDraft();
    assert.deepEqual(draft.kitchen, ['Rice']);
    assert.equal(draft.household, 4);
    assert.equal(draft.city, null);
    assert.equal(draft.kitchenConfirmed, false);
  });

  it('drops slots that are not real meal names', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ slots: ['lunch', 'brunch', 'supper'] }));

    assert.deepEqual(readDraft().slots, ['lunch']);
  });

  it('treats an unknown repeats value as the default', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ repeats: 'sometimes' }));

    assert.equal(readDraft().repeats, 'leftovers');
  });

  it('treats an empty city as no city', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ city: '' }));

    assert.equal(readDraft().city, null);
  });

  /**
   * Private windows, blocked site data and full quotas all throw on access.
   * A draft that cannot be stored is not worth failing a screen over.
   */
  it('does not throw when storage is unavailable', () => {
    globalThis.window = {
      get localStorage(): Storage {
        throw new Error('The operation is insecure.');
      },
    } as unknown as Window & typeof globalThis;

    assert.deepEqual(readDraft(), emptyDraft());
    assert.doesNotThrow(() => {
      writeDraft(emptyDraft());
    });
    assert.doesNotThrow(() => {
      clearDraft();
    });
  });
});
