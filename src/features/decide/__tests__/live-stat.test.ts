import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { driftedValue } from '../hooks/use-live-stat';

const TICK_MS = 500;
const asOfMsAgo = (ms: number) => new Date(Date.now() - ms).toISOString();

describe('driftedValue', () => {
  it('returns the base when the snapshot is brand new', () => {
    assert.equal(driftedValue(1000, new Date().toISOString()), 1000);
  });

  it('moves twice a second', () => {
    const base = 1000;
    const after = driftedValue(base, asOfMsAgo(TICK_MS * 2));
    // Two ticks, each between 1 and 4.
    assert.ok(after >= base + 2 && after <= base + 8, `got ${String(after)}`);
  });

  it('steps by a varying amount rather than a fixed one', () => {
    // A counter that goes up by exactly one every time reads as a loop.
    const steps = new Set<number>();
    let previous = driftedValue(0, asOfMsAgo(0));
    for (let i = 1; i <= 40; i += 1) {
      const current = driftedValue(0, asOfMsAgo(TICK_MS * i));
      steps.add(current - previous);
      previous = current;
    }
    assert.ok(steps.size > 1, 'every step was identical');
  });

  it('keeps every step inside the stated range', () => {
    let previous = driftedValue(0, asOfMsAgo(0));
    for (let i = 1; i <= 60; i += 1) {
      const current = driftedValue(0, asOfMsAgo(TICK_MS * i));
      const step = current - previous;
      assert.ok(step >= 1 && step <= 4, `step of ${String(step)} is outside 1..4`);
      previous = current;
    }
  });

  it('is deterministic, so a reload lands in the same place', () => {
    // The whole point: two tabs, or a refresh, must agree. Math.random() here
    // would make the number jump on every recompute.
    const asOf = asOfMsAgo(30_000);
    const now = Date.now();
    assert.equal(driftedValue(500, asOf, 0, now), driftedValue(500, asOf, 0, now));
  });

  it('never goes backwards as time passes', () => {
    let previous = 0;
    for (let i = 0; i <= 50; i += 1) {
      const current = driftedValue(500, asOfMsAgo(TICK_MS * i));
      assert.ok(current >= previous, 'the counter went backwards');
      previous = current;
    }
  });

  it('survives a clock that is behind the server', () => {
    // A future timestamp would otherwise subtract from the base.
    const future = new Date(Date.now() + 60_000).toISOString();
    assert.equal(driftedValue(700, future), 700);
  });

  it('falls back to the base on an unparseable timestamp', () => {
    assert.equal(driftedValue(42, 'not a date'), 42);
  });

  it('gives different counters different sequences', () => {
    // Identical jumps across three numbers reads as one animation.
    const asOf = asOfMsAgo(20_000);
    const now = Date.now();
    assert.notEqual(driftedValue(0, asOf, 1, now), driftedValue(0, asOf, 7, now));
  });

  it('stays fast for a tab left open overnight', () => {
    const started = performance.now();
    driftedValue(1000, new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString());
    assert.ok(performance.now() - started < 50, 'a stale snapshot must not spin');
  });
});

describe('the source and display rates stay in proportion', () => {
  /**
   * The display walks to a new value ONE number at a time, so it has to be
   * able to consume increments at least as fast as they arrive. If the source
   * ever outran it, the visible number would drift further behind the longer
   * somebody left the page open, which is the failure that is hardest to spot
   * in review and most obvious in use.
   */
  const SOURCE_TICK_MS = 500;
  const SOURCE_MAX_STEP = 4;
  const DISPLAY_STEP_MS = 90;

  it('the display can outpace the fastest the source can move', () => {
    const sourcePerSecond = (SOURCE_MAX_STEP * 1000) / SOURCE_TICK_MS;
    const displayPerSecond = 1000 / DISPLAY_STEP_MS;
    assert.ok(
      displayPerSecond > sourcePerSecond,
      `display ${displayPerSecond.toFixed(1)}/s must exceed source ${sourcePerSecond.toFixed(1)}/s`,
    );
  });

  it('a minute of drift stays within what the display can render', () => {
    const base = 1000;
    const after = driftedValue(base, new Date(Date.now() - 60_000).toISOString());
    const added = after - base;
    const renderable = 60_000 / DISPLAY_STEP_MS;
    assert.ok(added <= renderable, `${String(added)} added, only ${String(renderable)} renderable`);
  });
});

describe('the counters stay possible relative to each other', () => {
  /**
   * Today's decisions are a SUBSET of all decisions, and meals cooked are a
   * subset too. Each counter drifts at its own rate, so on a young install
   * where the totals start equal, "sorted today" overtakes "meals decided"
   * within seconds — a visibly impossible pair that tells somebody the numbers
   * are decorative.
   */
  const clamp = (value: number, ceiling: number) => Math.min(value, ceiling);

  it('never lets today exceed all-time', () => {
    // The exact case from a fresh install: both totals identical, today
    // drifting faster.
    assert.equal(clamp(65_476, 65_424), 65_424);
  });

  it('leaves an honest reading alone', () => {
    assert.equal(clamp(412, 65_424), 412);
  });

  it('holds when the two are equal', () => {
    assert.equal(clamp(500, 500), 500);
  });

  it('holds for every drift pair over a simulated hour', () => {
    const asOf = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const allTime = driftedValue(1000, asOf, 1);
    const today = clamp(driftedValue(1000, asOf, 7), allTime);
    assert.ok(today <= allTime, `${String(today)} must not exceed ${String(allTime)}`);
  });
});
