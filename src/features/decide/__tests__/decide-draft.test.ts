import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

/**
 * A minimal sessionStorage, because these tests run in node and the real one
 * is a browser API. It also lets the "storage throws" case be exercised, which
 * is a real thing in a private window and the reason every access is guarded.
 */
class MemoryStorage {
  private store = new Map<string, string>();
  throwOnAccess = false;

  getItem(key: string): string | null {
    if (this.throwOnAccess) throw new Error('storage disabled');
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    if (this.throwOnAccess) throw new Error('storage disabled');
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    if (this.throwOnAccess) throw new Error('storage disabled');
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

const storage = new MemoryStorage();
(globalThis as unknown as { window: unknown }).window = { sessionStorage: storage };

const { decideDraft, draftToPayload, emptyDraft, isDecidable, rejectMeal } =
  await import('../services/decide-draft');

beforeEach(() => {
  storage.clear();
  storage.throwOnAccess = false;
});

describe('decideDraft', () => {
  it('starts empty', () => {
    const draft = emptyDraft();
    assert.equal(draft.mood, null);
    assert.equal(draft.weight, null);
    assert.deepEqual(draft.kitchenItems, []);
    assert.equal(draft.verdict, null);
  });

  it('patches one slice without blanking another', () => {
    // A step that collects a mood must never clear the kitchen a previous
    // step filled — the same discipline OnboardingService.save uses.
    decideDraft.patch({ kitchenItems: ['rice', 'beans'] });
    decideDraft.patch({ mood: 'fast' });
    const draft = decideDraft.get();
    assert.deepEqual(draft?.kitchenItems, ['rice', 'beans']);
    assert.equal(draft?.mood, 'fast');
  });

  it('survives a reload', () => {
    decideDraft.patch({ mood: 'tired', weight: 'soupy' });
    assert.equal(decideDraft.get()?.mood, 'tired');
  });

  it('discards a draft of an older shape', () => {
    // One session of taps is not worth migrating, and guessing at an old
    // shape risks sending nonsense to the endpoint.
    storage.setItem('kj.decide_draft', JSON.stringify({ v: 0, mood: 'fast' }));
    assert.equal(decideDraft.get(), null);
  });

  it('survives corrupt JSON', () => {
    storage.setItem('kj.decide_draft', '{not json');
    assert.equal(decideDraft.get(), null);
  });

  it('never throws when storage is disabled', () => {
    // Private windows throw outright on access; an unguarded getter here
    // would take down the flow on boot.
    storage.throwOnAccess = true;
    assert.doesNotThrow(() => decideDraft.get());
    assert.doesNotThrow(() => { decideDraft.patch({ mood: 'fast' }); });
    assert.doesNotThrow(() => { decideDraft.clear(); });
  });

  it('keeps the whole kitchen list, however long', () => {
    // It used to be cut to 40, silently. A big kitchen is the best input there is.
    const many = Array.from({ length: 250 }, (_, i) => `item-${String(i)}`);
    const draft = decideDraft.patch({ kitchenItems: many });
    assert.equal(draft.kitchenItems.length, 250);
    assert.equal(draft.kitchenItems[249], 'item-249');
  });

  it('keeps the most recent refusals when capped', () => {
    const many = Array.from({ length: 30 }, (_, i) => `meal-${String(i)}`);
    const draft = decideDraft.patch({ rejected: many });
    assert.equal(draft.rejected.length, 20);
    assert.equal(draft.rejected.at(-1), 'meal-29');
  });

  it('clears', () => {
    decideDraft.patch({ mood: 'fast' });
    decideDraft.clear();
    assert.equal(decideDraft.get(), null);
  });
});

describe('isDecidable', () => {
  it('needs both required answers', () => {
    assert.equal(isDecidable({ ...emptyDraft(), mood: 'fast' }), false);
    assert.equal(isDecidable({ ...emptyDraft(), weight: 'rice' }), false);
    assert.equal(isDecidable({ ...emptyDraft(), mood: 'fast', weight: 'rice' }), true);
  });
});

describe('draftToPayload', () => {
  it('defaults minutes when none was chosen', () => {
    const payload = draftToPayload({ ...emptyDraft(), mood: 'fast', weight: 'rice' });
    assert.equal(payload.minutes, 40);
  });

  it('omits an empty city rather than sending a blank string', () => {
    const payload = draftToPayload({ ...emptyDraft(), mood: 'fast', weight: 'rice', city: '  ' });
    assert.equal('city' in payload, false);
  });

  it('sends a real city', () => {
    const payload = draftToPayload({ ...emptyDraft(), mood: 'fast', weight: 'rice', city: 'Lagos' });
    assert.equal(payload.city, 'Lagos');
  });

  it('carries the skipped flag, which is a real answer', () => {
    const payload = draftToPayload({
      ...emptyDraft(),
      mood: 'tired',
      weight: 'soupy',
      kitchenSkipped: true,
    });
    assert.equal(payload.kitchen_skipped, true);
    assert.deepEqual(payload.kitchen_items, []);
  });
});

describe('rejectMeal', () => {
  it('records the refusal and drops the stale verdict', () => {
    const draft = rejectMeal('meal-1');
    assert.deepEqual(draft.rejected, ['meal-1']);
    assert.equal(draft.verdict, null);
  });

  it('does not record the same refusal twice', () => {
    rejectMeal('meal-1');
    const draft = rejectMeal('meal-1');
    assert.deepEqual(draft.rejected, ['meal-1']);
  });
});
