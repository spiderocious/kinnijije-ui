import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

/**
 * The decision a swipe makes, as a pure function.
 *
 * Mirrors `onPointerUp` in use-swipe.ts. It exists because the first version
 * read the travelled distance from REACT STATE inside the handler, which closes
 * over the value from the render the handler was created in — 0 on the first
 * drag of a slide. The threshold was therefore never met and swiping silently
 * did nothing, with no error anywhere.
 */
const THRESHOLD_RATIO = 0.18;
const FALLBACK_THRESHOLD_PX = 48;

function decide(input: {
  travelled: number;
  width: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
}): 'next' | 'previous' | 'stay' {
  const threshold =
    input.width > 0 ? input.width * THRESHOLD_RATIO : FALLBACK_THRESHOLD_PX;

  if (input.travelled <= -threshold && input.canGoNext) return 'next';
  if (input.travelled >= threshold && input.canGoPrevious) return 'previous';
  return 'stay';
}

const base = { width: 400, canGoNext: true, canGoPrevious: true };

describe('the swipe decision', () => {
  it('advances on a decisive drag left', () => {
    assert.equal(decide({ ...base, travelled: -200 }), 'next');
  });

  it('goes back on a decisive drag right', () => {
    assert.equal(decide({ ...base, travelled: 200 }), 'previous');
  });

  it('stays put on a tap', () => {
    // A tap registers a few pixels of travel and must not move the carousel.
    assert.equal(decide({ ...base, travelled: -4 }), 'stay');
  });

  it('acts on a drag just past the threshold', () => {
    // THE REGRESSION. Reading 0 here — which is what a stale closure gave —
    // means every swipe lands in 'stay' and the gesture appears dead.
    const justOver = -(400 * THRESHOLD_RATIO) - 1;
    assert.equal(decide({ ...base, travelled: justOver }), 'next');
  });

  it('does nothing when travelled is zero', () => {
    // Asserts the failure mode directly, so a reintroduced stale read fails a
    // test rather than a hand-test on a phone.
    assert.equal(decide({ ...base, travelled: 0 }), 'stay');
  });

  it('scales the threshold with the viewport', () => {
    // 60px is a real swipe on a 320px phone and a twitch on a 1000px tablet.
    assert.equal(decide({ ...base, width: 320, travelled: -60 }), 'next');
    assert.equal(decide({ ...base, width: 1000, travelled: -60 }), 'stay');
  });

  it('falls back to pixels before the element is measured', () => {
    assert.equal(decide({ ...base, width: 0, travelled: -FALLBACK_THRESHOLD_PX - 1 }), 'next');
  });

  it('refuses to move past the ends', () => {
    assert.equal(decide({ ...base, travelled: -300, canGoNext: false }), 'stay');
    assert.equal(decide({ ...base, travelled: 300, canGoPrevious: false }), 'stay');
  });
});
