import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { askApi } from '../services/ask.api';
import type { AskTurn } from '../types/ask.types';

/**
 * Following one turn to its conclusion.
 *
 * SSE first, polling as the fallback — and the fallback is not a degraded mode
 * but a supported one. Every event the stream sends is also readable from a
 * plain GET, so a client behind a proxy that buffers event streams loses
 * immediacy and nothing else. That rule comes from the jobs stream and it is
 * what makes the stream safe to attempt at all.
 */

/** Matches the server's cap. Past this the turn is abandoned, not retried. */
const GIVE_UP_MS = 90_000;

/** When SSE is off or unavailable. Frequent enough to feel live. */
const POLL_MS = 700;

export interface UseAskTurn {
  turn: AskTurn | null;
  /** The raw text, as soon as it exists — before the parse finishes. */
  transcript: string | null;
  /** How the result is arriving. Reported so the console can see the split. */
  transport: 'sse' | 'poll' | null;
  /**
   * @param forSession pass the id when the session was created in this same
   *   tick — the hook's own state has not flushed yet and would be null.
   */
  follow: (turnId: string, forSession?: string) => void;
  reset: () => void;
}

export function useAskTurn(sessionId: string | null, streamingOn: boolean): UseAskTurn {
  const [turn, setTurn] = useState<AskTurn | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [transport, setTransport] = useState<'sse' | 'poll' | null>(null);

  /** Held in refs so cleanup can reach them without re-running the effect. */
  const sourceRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const capRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    sourceRef.current?.close();
    sourceRef.current = null;
    if (pollRef.current !== null) clearInterval(pollRef.current);
    pollRef.current = null;
    if (capRef.current !== null) clearTimeout(capRef.current);
    capRef.current = null;
  }, []);

  const reset = useCallback(() => {
    stop();
    setTurn(null);
    setTranscript(null);
    setTransport(null);
  }, [stop]);

  /**
   * @param forSession the session to follow within.
   *
   * Passed in rather than read from the closure because of a real freeze: the
   * caller does `await session.ensure()` to CREATE a session, then calls this
   * in the same render — where `sessionId` is still null, because state has not
   * flushed yet. `follow` then returned early and silently did nothing: no
   * stream, no polling, a spinner that never resolved while the job behind it
   * succeeded.
   *
   * An argument makes the dependency explicit instead of racing React.
   */
  const follow = useCallback(
    (turnId: string, forSession?: string) => {
      const activeSession = forSession ?? sessionId;
      if (activeSession === null) return;
      stop();
      setTranscript(null);

      /** Whichever transport gets there first ends the other. */
      const settle = (next: AskTurn): void => {
        setTurn(next);
        if (next.status === 'done' || next.status === 'failed') stop();
      };

      const startPolling = (): void => {
        setTransport('poll');
        pollRef.current = setInterval(() => {
          void askApi
            .turn(activeSession, turnId)
            .then((next) => {
              if (next.raw_text !== null) setTranscript(next.raw_text);
              settle(next);
            })
            .catch(() => {
              // A failed poll is not fatal — the next one may succeed, and the
              // cap below stops this running forever.
            });
        }, POLL_MS);
      };

      if (!streamingOn || typeof EventSource === 'undefined') {
        startPolling();
      } else {
        const source = new EventSource(askApi.streamUrl(activeSession, turnId));
        sourceRef.current = source;
        setTransport('sse');

        // The payoff of streaming: the words appear before the parse finishes.
        source.addEventListener('transcript', (event) => {
          const data = JSON.parse((event as MessageEvent<string>).data) as { text: string };
          setTranscript(data.text);
        });

        source.addEventListener('parsed', (event) => {
          settle(JSON.parse((event as MessageEvent<string>).data) as AskTurn);
        });

        source.addEventListener('failed', () => {
          void askApi.turn(activeSession, turnId).then(settle).catch(() => { stop(); });
        });

        /**
         * An error here is usually a proxy that buffers event streams rather
         * than a server fault, so it falls back rather than failing. The user
         * sees a slightly later answer and nothing else.
         */
        source.onerror = () => {
          source.close();
          sourceRef.current = null;
          if (pollRef.current === null) startPolling();
        };
      }

      capRef.current = setTimeout(stop, GIVE_UP_MS);
    },
    [sessionId, streamingOn, stop],
  );

  // Leaving mid-turn must not leave a connection or a timer behind.
  useEffect(() => stop, [stop]);

  /**
   * Memoised so the object identity is stable.
   *
   * A fresh literal every render makes this hook's result useless as an effect
   * dependency — any consumer that depends on it re-runs constantly, which is
   * how the runaway decide loop got its fuel.
   */
  return useMemo(
    () => ({ turn, transcript, transport, follow, reset }),
    [turn, transcript, transport, follow, reset],
  );
}
