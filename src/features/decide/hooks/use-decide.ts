import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { EVENTS, analytics } from '@shared/services/analytics';
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

    // The taste distribution of real demand — which moods, weights and time
    // budgets people actually pick. This one event drives what to commission.
    analytics.track(EVENTS.DECIDE_REQUESTED, {
      kitchen_item_count: current.kitchenItems.length,
      kitchen_skipped: current.kitchenSkipped,
      mood: current.mood,
      weight: current.weight,
      minutes: current.minutes,
      city: current.city,
      rejected_count: current.rejected.length,
      is_retry: current.rejected.length > 0,
    });

    const started = Date.now();

    try {
      const answer = await mutation.mutateAsync(draftToPayload(current));
      setVerdict(answer);
      setDraft(storeVerdict(answer));

      const winner = answer.verdict;
      // An empty verdict is the sentinel for "nothing matched at all" — a
      // different outcome to a bad match, and the precise shape of a gap in
      // the catalogue.
      if (winner.meal_id === '') {
        analytics.track(EVENTS.DECIDE_VERDICT_EMPTY, {
          kitchen_item_count: current.kitchenItems.length,
          mood: current.mood,
          weight: current.weight,
          minutes: current.minutes,
        });
      } else {
        analytics.track(EVENTS.DECIDE_VERDICT_SHOWN, {
          meal_id: winner.meal_id,
          meal_slug: winner.slug,
          // `deterministic` means the model timed out or was rejected and the
          // fallback answered. The ratio is the health of the AI path.
          provenance: answer.provenance,
          match_score: winner.match.score,
          have_count: winner.match.have.length,
          missing_count: winner.match.missing.length,
          alternate_count: answer.alternates.length,
          pool_count: answer.pool.length,
          cook_time_minutes: winner.cook_time_minutes,
          difficulty: winner.difficulty,
          latency_ms: Date.now() - started,
        });
        analytics.incrementProfile('decides_total');
      }
    } catch (caught) {
      if (caught instanceof ApiError) {
        // A 429 is not an error screen — it is the signup pitch, with an
        // honest wait attached.
        if (caught.retryAfterSeconds !== undefined) {
          setRetryAfter(caught.retryAfterSeconds);
          analytics.track(EVENTS.DECIDE_RATE_LIMITED, {
            retry_after_seconds: caught.retryAfterSeconds,
            rejected_count: current.rejected.length,
          });
        } else {
          analytics.track(EVENTS.DECIDE_FAILED, {
            error_code: caught.code,
            http_status: caught.status,
          });
        }
        setError(caught.message);
        return;
      }
      analytics.track(EVENTS.DECIDE_FAILED, { error_code: 'unknown', http_status: null });
      setError('Something went wrong. Try again.');
    }
  }, [mutation]);

  const chooseAlternate = useCallback(
    (mealId: string) => {
      setVerdict((current) => {
        if (current === null) return current;
        // High rates here mean the ranker's ORDERING is wrong while its
        // shortlist is right — a different fix to a bad shortlist.
        analytics.track(EVENTS.DECIDE_ALTERNATE_CHOSEN, {
          meal_id: mealId,
          from_meal_id: current.verdict.meal_id,
          position: current.alternates.findIndex((meal) => meal.meal_id === mealId) + 1,
        });
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

      // The strongest negative signal in the app. It costs nothing (a local
      // re-rank), so people use it freely — which is what makes it honest.
      const rejected =
        current.verdict.meal_id === mealId
          ? current.verdict
          : current.alternates.find((meal) => meal.meal_id === mealId);
      analytics.track(EVENTS.DECIDE_MEAL_REJECTED, {
        meal_id: mealId,
        meal_slug: rejected?.slug ?? null,
        position: current.verdict.meal_id === mealId
          ? 0
          : current.alternates.findIndex((meal) => meal.meal_id === mealId) + 1,
        rejected_total: decideDraft.ensure().rejected.length + 1,
        match_score: rejected?.match.score ?? null,
        missing_count: rejected?.match.missing.length ?? null,
      });

      const next = rejectAndPromote(current, mealId);
      if (next === null) {
        setExhausted(true);
        // They said no to everything we had. The worst outcome short of an
        // error, and a direct measure of catalogue depth for this taste.
        const draft = decideDraft.ensure();
        analytics.track(EVENTS.DECIDE_EXHAUSTED, {
          rejected_count: draft.rejected.length + 1,
          mood: draft.mood,
          weight: draft.weight,
          minutes: draft.minutes,
        });
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
    const previous = decideDraft.ensure();
    // A restart AFTER a verdict is rejection of the whole answer, not one meal.
    analytics.track(EVENTS.DECIDE_RESTARTED, {
      had_verdict: previous.verdict !== null,
      rejected_count: previous.rejected.length,
    });
    const kept = previous.rejected;
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
