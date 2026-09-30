import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

/**
 * When the invite may appear, as a pure predicate.
 *
 * Mirrors the condition in decide-screen.tsx. A mid-flow interstitial is the
 * pattern people mean when they call a site annoying, so each guard is
 * asserted on its own — a regression in any one of them turns a defensible
 * offer into a nuisance.
 */
interface InviteState {
  flagOn: boolean;
  isSignedIn: boolean;
  dismissed: boolean;
  stage: string;
}

function shouldShowInvite(s: InviteState): boolean {
  return s.flagOn && !s.isSignedIn && !s.dismissed && s.stage === 'weight';
}

const base: InviteState = {
  flagOn: true,
  isSignedIn: false,
  dismissed: false,
  stage: 'weight',
};

describe('the invite', () => {
  it('appears for a guest partway through', () => {
    assert.equal(shouldShowInvite(base), true);
  });

  it('never appears with the flag off', () => {
    // It ships dark. The flag is what makes the trade measurable.
    assert.equal(shouldShowInvite({ ...base, flagOn: false }), false);
  });

  it('never appears to somebody already signed in', () => {
    // Asking a member to join is the clearest signal we do not know them.
    assert.equal(shouldShowInvite({ ...base, isSignedIn: true }), false);
  });

  it('never appears twice', () => {
    // One dismissal ends it for the session.
    assert.equal(shouldShowInvite({ ...base, dismissed: true }), false);
  });

  it('never appears before there is something to lose', () => {
    // The hero and the first questions are too early: nothing is invested yet,
    // so the ask reads as a toll gate rather than an offer.
    for (const stage of ['hero', 'kitchen', 'mood']) {
      assert.equal(shouldShowInvite({ ...base, stage }), false, `fired on ${stage}`);
    }
  });

  it('never appears on the verdict, which has its own offer', () => {
    // Two asks on one screen is nagging.
    assert.equal(shouldShowInvite({ ...base, stage: 'verdict' }), false);
  });
});

/**
 * The step count a person is shown.
 *
 * A signed-in cook skips the kitchen, so telling them "2 of 4" when only three
 * will be asked is a small lie that makes the whole flow feel careless.
 */
function stepsFor(canSkipKitchen: boolean): { total: number; offset: number } {
  return canSkipKitchen ? { total: 3, offset: 0 } : { total: 4, offset: 1 };
}

describe('the step count', () => {
  it('is four for a guest', () => {
    const { total, offset } = stepsFor(false);
    assert.equal(total, 4);
    assert.equal(offset + 1, 2, 'mood is the second question');
    assert.equal(offset + 3, 4, 'time is the last');
  });

  it('is three when the kitchen is already known', () => {
    const { total, offset } = stepsFor(true);
    assert.equal(total, 3);
    assert.equal(offset + 1, 1, 'mood becomes the first question');
    assert.equal(offset + 3, 3, 'time is still the last');
  });

  it('always ends on the last step', () => {
    for (const canSkip of [true, false]) {
      const { total, offset } = stepsFor(canSkip);
      assert.equal(offset + 3, total, 'the final question must be numbered last');
    }
  });
});
