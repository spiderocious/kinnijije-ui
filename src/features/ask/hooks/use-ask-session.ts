import { useCallback, useEffect, useRef, useState } from 'react';

import { askApi } from '../services/ask.api';

/**
 * The conversation's identity.
 *
 * Held in `sessionStorage` rather than `localStorage`, for the same reason the
 * decide draft is: a shared laptop must not carry one person's conversation —
 * and what they said out loud — into the next person's visit.
 *
 * Created lazily on the first turn rather than on mount, so simply opening the
 * page costs no write. A stale id from an expired session is replaced silently;
 * the alternative is showing somebody an error about a thing they never knew
 * existed.
 */
const KEY = 'kj.ask_session';

export interface UseAskSession {
  sessionId: string | null;
  /** Creates one if needed. Safe to call on every turn. */
  ensure: () => Promise<string | null>;
  reset: () => void;
}

export function useAskSession(): UseAskSession {
  const [sessionId, setSessionId] = useState<string | null>(() => {
    /**
     * The URL wins over storage.
     *
     * Somebody who opened `/ask/asks_01abc` meant that conversation — honouring
     * a different id from storage would quietly show them somebody else's
     * thread, or their own older one, and look like the link did not work.
     */
    const fromUrl = window.location.pathname.match(/\/ask\/(asks_[a-z0-9]+)/)?.[1];
    if (fromUrl !== undefined) return fromUrl;

    try {
      return sessionStorage.getItem(KEY);
    } catch {
      // Private mode, blocked storage. The flow still works; it just cannot be
      // resumed after a reload.
      return null;
    }
  });

  /** Stops two near-simultaneous turns creating two sessions. */
  const inFlight = useRef<Promise<string | null> | null>(null);

  const ensure = useCallback(async (): Promise<string | null> => {
    if (sessionId !== null) return sessionId;
    if (inFlight.current !== null) return inFlight.current;

    inFlight.current = askApi
      .start()
      .then((session) => {
        try {
          sessionStorage.setItem(KEY, session.id);
        } catch {
          // Not fatal — the id lives in state for this page view.
        }
        setSessionId(session.id);
        return session.id;
      })
      .catch(() => null)
      .finally(() => {
        inFlight.current = null;
      });

    return inFlight.current;
  }, [sessionId]);

  const reset = useCallback(() => {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      // Ignored for the same reason as above.
    }
    setSessionId(null);
  }, []);

  // A session id that the server has forgotten is worse than none: every turn
  // would 404. One cheap check on mount replaces it quietly.
  useEffect(() => {
    if (sessionId === null) return;
    void askApi.session(sessionId).catch(() => { reset(); });
  }, [sessionId, reset]);

  return { sessionId, ensure, reset };
}
