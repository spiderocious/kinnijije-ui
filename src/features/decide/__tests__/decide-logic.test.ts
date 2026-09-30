import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { allMeals, promote, rejectAndPromote } from '../services/decide-rerank';
import type { DecideMeal, DecideVerdict } from '../types/decide.types';

function meal(id: string, name = id): DecideMeal {
  return {
    meal_id: id,
    slug: id,
    name,
    why: `templated why for ${name}`,
    cook_time_minutes: 30,
    difficulty: 'easy',
    serves: 4,
    match: { score: 0.5, have: [], missing: [], low: [], pantry: [] },
    hero_icon: null,
    tags: [],
  };
}

function verdict(): DecideVerdict {
  return {
    verdict: { ...meal('a'), why: 'MODEL WROTE THIS ABOUT A' },
    alternates: [meal('b'), meal('c')],
    pool: [meal('b'), meal('c'), meal('d')],
    framing: 'a framing line',
    provenance: 'ai_framed',
  };
}

describe('allMeals', () => {
  it('lists the winner first', () => {
    assert.equal(allMeals(verdict())[0]?.meal_id, 'a');
  });

  it('de-duplicates meals that appear in both alternates and pool', () => {
    // The response deliberately repeats them, so a naive concat would show
    // the same dish twice in the carousel.
    const ids = allMeals(verdict()).map((m) => m.meal_id);
    assert.deepEqual(ids, ['a', 'b', 'c', 'd']);
  });
});

describe('promote', () => {
  it('moves the chosen meal into the hero slot', () => {
    const next = promote(verdict(), 'b');
    assert.equal(next.verdict.meal_id, 'b');
  });

  it('demotes the previous winner into the list', () => {
    const next = promote(verdict(), 'b');
    assert.ok([...next.alternates, ...next.pool].some((m) => m.meal_id === 'a'));
  });

  it('never carries the model sentence onto a different dish', () => {
    // The whole point: that sentence cites reasons belonging to meal A, and
    // showing it above meal B would be a confident lie about their kitchen.
    const next = promote(verdict(), 'b');
    assert.notEqual(next.verdict.why, 'MODEL WROTE THIS ABOUT A');
    assert.match(next.verdict.why, /templated why for b/);
  });

  it('drops the AI provenance mark with it', () => {
    assert.equal(promote(verdict(), 'b').provenance, 'deterministic');
  });

  it('is a no-op for an unknown id', () => {
    const before = verdict();
    assert.deepEqual(promote(before, 'nope'), before);
  });

  it('never shows the same meal twice', () => {
    const next = promote(verdict(), 'b');
    const ids = [next.verdict.meal_id, ...next.alternates.map((m) => m.meal_id)];
    assert.equal(new Set(ids).size, ids.length);
  });
});

describe('rejectAndPromote', () => {
  it('removes the refused meal entirely', () => {
    const next = rejectAndPromote(verdict(), 'a');
    assert.ok(next);
    const ids = [next.verdict.meal_id, ...next.alternates.map((m) => m.meal_id), ...next.pool.map((m) => m.meal_id)];
    assert.ok(!ids.includes('a'));
  });

  it('promotes the next candidate', () => {
    const next = rejectAndPromote(verdict(), 'a');
    assert.equal(next?.verdict.meal_id, 'b');
  });

  it('returns null when the shortlist is exhausted', () => {
    // The caller then says so and offers to widen a filter, which is the only
    // thing that can actually help.
    let current: DecideVerdict | null = verdict();
    for (const id of ['a', 'b', 'c', 'd']) {
      current = current === null ? null : rejectAndPromote(current, id);
    }
    assert.equal(current, null);
  });

  it('drops the AI provenance mark', () => {
    assert.equal(rejectAndPromote(verdict(), 'a')?.provenance, 'deterministic');
  });
});

describe('the carousel slide list', () => {
  /**
   * `promote` rebuilds `pool` from every meal INCLUDING the new winner, so a
   * naive `[verdict, ...pool]` shows the same dish twice: once as the hero and
   * again a slide later. The carousel de-duplicates by meal id.
   */
  const slidesFor = (v: DecideVerdict) =>
    [v.verdict, ...v.pool].filter(
      (m, i, all) => all.findIndex((other) => other.meal_id === m.meal_id) === i,
    );

  it('never shows the same meal twice after a promotion', () => {
    const promoted = promote(verdict(), 'b');
    const ids = slidesFor(promoted).map((m) => m.meal_id);
    assert.equal(new Set(ids).size, ids.length, `duplicate in ${ids.join(',')}`);
  });

  it('leads with the current winner', () => {
    const promoted = promote(verdict(), 'c');
    assert.equal(slidesFor(promoted)[0]?.meal_id, 'c');
  });

  it('never shows a duplicate after a rejection', () => {
    const next = rejectAndPromote(verdict(), 'a');
    assert.ok(next);
    const ids = slidesFor(next).map((m) => m.meal_id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(!ids.includes('a'), 'the refused meal must be gone');
  });
});
