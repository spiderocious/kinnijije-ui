import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@shared/services/api-client';

import { decideApi } from '../services/decide.api';
import { optionsCache } from '../services/decide-options-cache';
import {
  decideDraft,
  draftToPayload,
  isDecidable,
  rejectMeal,
  storeVerdict,
} from '../services/decide-draft';
import { promote, rejectAndPromote } from '../services/decide-rerank';
import type { DecideDraft, DecideVerdict } from '../types/decide.types';

/**
 * The tiles.
 *
 * 400+ ingredients that change only when the catalogue does, so they are
 * cached hard at three layers: the HTTP cache (ETag, a day), react-query's
 * memory cache, and `localStorage` across visits.
 *
 * The stored copy seeds `initialData`, so the kitchen screen paints instantly
 * on a repeat visit and the network request becomes a background revalidation
 * rather than something the person waits on. Eviction is by the payload's own
 * fingerprint, so editing the catalogue clears every copy with nothing to purge.
 */
export function useDecideOptions() {
  const cached = optionsCache.read();

  const query = useQuery({
    queryKey: ['decide', 'options'],
    queryFn: async () => {
      const fresh = await decideApi.options();
      optionsCache.write(fresh);
      return fresh;
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    ...(cached !== null && { initialData: cached, initialDataUpdatedAt: 0 }),
  });

  return query;
}

/**
 * Warms the tiles the moment somebody lands.
 *
 * The kitchen screen is two taps away, and fetching there means a visible
 * wait. Fetching here means it is already in memory by the time they arrive.
 */
export function usePrefetchDecideOptions(): void {
  const client = useQueryClient();

  useEffect(() => {
    void client.prefetchQuery({
      queryKey: ['decide', 'options'],
      queryFn: async () => {
        const fresh = await decideApi.options();
        optionsCache.write(fresh);
        return fresh;
      },
      staleTime: 60 * 60 * 1000,
    });
  }, [client]);
}

export interface UseDecideResult {
  draft: DecideDraft;
  verdict: DecideVerdict | null;
  isDeciding: boolean;
  /** Seconds to wait, when the IP bucket refused. Drives the signup pitch. */
  retryAfterSeconds: number | null;
  error: string | null;
  /** Spends one of the 8/hour. The only call that does. */
  decide: () => Promise<void>;
  /** Free. Local re-rank. */
  chooseAlternate: (mealId: string) => void;
  /** Free. Local re-rank + the refusal is remembered for the next real call. */
  reject: (mealId: string) => void;
  /** True once every candidate has been refused. */
  exhausted: boolean;
  patch: (changes: Partial<DecideDraft>) => void;
  reset: () => void;
}

export function useDecide(): UseDecideResult {
  const [draft, setDraft] = useState<DecideDraft>(() => decideDraft.ensure());
  const [verdict, setVerdict] = useState<DecideVerdict | null>(() => decideDraft.ensure().verdict);
  const [exhausted, setExhausted] = useState(false);
  const [retryAfterSeconds, setRetryAfter] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof decideApi.decide>[0]) => decideApi.decide(payload),
  });

  const patch = useCallback((changes: Partial<DecideDraft>) => {
    setDraft(decideDraft.patch(changes));
  }, []);

  const decide = useCallback(async () => {
    const current = decideDraft.ensure();
    if (!isDecidable(current)) return;

    setError(null);
    setRetryAfter(null);
    setExhausted(false);

    try {
      const answer = await mutation.mutateAsync(draftToPayload(current));
      setVerdict(answer);
      setDraft(storeVerdict(answer));
    } catch (caught) {
      if (caught instanceof ApiError) {
        // A 429 is not an error screen — it is the signup pitch, with an
        // honest wait attached.
        if (caught.retryAfterSeconds !== undefined) setRetryAfter(caught.retryAfterSeconds);
        setError(caught.message);
        return;
      }
      setError('Something went wrong. Try again.');
    }
  }, [mutation]);

  const chooseAlternate = useCallback(
    (mealId: string) => {
      setVerdict((current) => {
        if (current === null) return current;
        const next = promote(current, mealId);
        decideDraft.patch({ verdict: next });
        return next;
      });
    },
    [],
  );

  const reject = useCallback((mealId: string) => {
    setVerdict((current) => {
      if (current === null) return current;
      const next = rejectAndPromote(current, mealId);
      if (next === null) {
        setExhausted(true);
        // The refusal is still recorded, so a later real call will not offer
        // it again even though there is nothing to promote right now.
        setDraft(rejectMeal(mealId));
        return current;
      }
      const updated = rejectMeal(mealId);
      setDraft(decideDraft.patch({ rejected: updated.rejected, verdict: next }));
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const kept = decideDraft.ensure().rejected;
    decideDraft.clear();
    // Refusals survive a restart: saying no twice to the same dish is the
    // clearest possible sign we were not listening.
    setDraft(decideDraft.patch({ rejected: kept }));
    setVerdict(null);
    setExhausted(false);
    setError(null);
    setRetryAfter(null);
  }, []);

  return useMemo(
    () => ({
      draft,
      verdict,
      isDeciding: mutation.isPending,
      retryAfterSeconds,
      error,
      decide,
      chooseAlternate,
      reject,
      exhausted,
      patch,
      reset,
    }),
    [draft, verdict, mutation.isPending, retryAfterSeconds, error, decide, chooseAlternate, reject, exhausted, patch, reset],
  );
}
