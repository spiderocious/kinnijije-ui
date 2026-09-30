import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

/**
 * The guard that sends somebody back when they land on a step the draft cannot
 * support, expressed as a pure predicate so it can be tested without a DOM.
 *
 * It must mirror the condition in decide-screen.tsx. This exists because the
 * first version omitted `requested` and `error`, which meant every decision
 * bounced back to the time step in the gap between navigating to the verdict
 * and the request flipping `isDeciding` — so nothing ever appeared to match.
 */
interface GuardState {
  stage: string;
  verdict: unknown | null;
  isDeciding: boolean;
  requested: boolean;
  error: string | null;
  retryAfterSeconds: number | null;
}

function shouldBounceFromVerdict(s: GuardState): boolean {
  return (
    s.stage === 'verdict' &&
    s.verdict === null &&
    !s.isDeciding &&
    !s.requested &&
    s.error === null &&
    s.retryAfterSeconds === null
  );
}

const base: GuardState = {
  stage: 'verdict',
  verdict: null,
  isDeciding: false,
  requested: false,
  error: null,
  retryAfterSeconds: null,
};

describe('the verdict guard', () => {
  it('does NOT bounce in the gap between pressing Decide and the request starting', () => {
    // THE REGRESSION. `requested` is set before navigating, so this window,
    // where the step has changed but `isDeciding` has not yet flipped, must
    // not be treated as "arrived here by accident".
    assert.equal(shouldBounceFromVerdict({ ...base, requested: true }), false);
  });

  it('does not bounce while the request is in flight', () => {
    assert.equal(
      shouldBounceFromVerdict({ ...base, requested: true, isDeciding: true }),
      false,
    );
  });

  it('does not bounce when the request failed', () => {
    // The error screen has to be reachable, or a failure looks like a no-op.
    assert.equal(
      shouldBounceFromVerdict({ ...base, requested: true, error: 'boom' }),
      false,
    );
  });

  it('does not bounce when the IP bucket refused', () => {
    // The 429 IS the signup pitch, so it must render rather than redirect.
    assert.equal(
      shouldBounceFromVerdict({ ...base, requested: true, retryAfterSeconds: 300 }),
      false,
    );
  });

  it('does not bounce once there is a verdict', () => {
    assert.equal(shouldBounceFromVerdict({ ...base, verdict: {}, requested: true }), false);
  });

  it('DOES bounce on a cold arrival at ?step=verdict', () => {
    // A shared or hand-edited URL with nothing decided is the case the guard
    // exists for: it must still correct, or the screen renders empty.
    assert.equal(shouldBounceFromVerdict(base), true);
  });

  it('leaves every other step alone', () => {
    for (const stage of ['hero', 'kitchen', 'mood', 'weight', 'time']) {
      assert.equal(shouldBounceFromVerdict({ ...base, stage }), false);
    }
  });
});
