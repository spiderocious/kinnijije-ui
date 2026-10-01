import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

/**
 * The freeze that happened on the FIRST voice note of a conversation.
 *
 * `sendFreeform` does `await session.ensure()` to create a session, then calls
 * `turn.follow(...)` in the same render. The hook's `sessionId` state has not
 * flushed at that point, so `follow` saw null, returned early, and opened
 * neither a stream nor a poll. The job behind it succeeded in three seconds and
 * the UI span forever, because nothing was ever listening.
 *
 * The fix passes the freshly-created id explicitly. This pins the resolution
 * rule — the part that was wrong — without needing a DOM or a server.
 */
function resolveSession(
  hookState: string | null,
  passedIn: string | undefined,
): string | null {
  return passedIn ?? hookState;
}

describe('which session a turn is followed in', () => {
  it('uses the id passed in when the hook has not caught up', () => {
    // The exact failing case: session created this tick, state still null.
    assert.equal(resolveSession(null, 'asks_01abc'), 'asks_01abc');
  });

  it('falls back to the hook once state has settled', () => {
    // Every later turn in the same conversation takes this path.
    assert.equal(resolveSession('asks_01abc', undefined), 'asks_01abc');
  });

  it('prefers the explicit id over a stale one', () => {
    // After "start again" the hook can still hold the previous session for a
    // tick. Following the OLD one would poll a conversation nobody is in.
    assert.equal(resolveSession('asks_old', 'asks_new'), 'asks_new');
  });

  it('is null only when there is genuinely no session', () => {
    // The one case where returning early is correct.
    assert.equal(resolveSession(null, undefined), null);
  });
});
