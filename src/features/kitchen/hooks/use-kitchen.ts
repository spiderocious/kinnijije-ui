import { useCallback, useEffect, useRef, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@shared/services/api-client';

import { kitchenApi } from '../services/kitchen.api';
import type { KitchenState } from '../types/kitchen.types';

const KITCHEN_KEY = ['kitchen'] as const;

/** How long after the last edit the basket is persisted. */
const SAVE_DEBOUNCE_MS = 800;

/**
 * The basket, held locally and synced to the server.
 *
 * Edits are local-first: a chip appears the instant it is typed, and the save
 * is debounced. Awaiting a round-trip per keystroke would make adding six
 * ingredients feel like six separate operations, and the basket is cheap to
 * replay if a save fails.
 */
export function useKitchen() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: KITCHEN_KEY, queryFn: kitchenApi.get });

  const [items, setItems] = useState<string[]>([]);
  const seeded = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useMutation<KitchenState, ApiError, string[]>({
    mutationFn: (next) => kitchenApi.save({ items: next }),
    onSuccess: (state) => {
      // Keep the server's recents, but do NOT overwrite `items` — the person
      // may have typed something else while the save was in flight.
      queryClient.setQueryData(KITCHEN_KEY, state);
    },
  });

  useEffect(() => {
    // Seed once. Re-seeding on every refetch would clobber in-progress edits.
    if (data === undefined || seeded.current) return;
    setItems(data.items);
    seeded.current = true;
  }, [data]);

  const scheduleSave = useCallback(
    (next: string[]) => {
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        save.mutate(next);
      }, SAVE_DEBOUNCE_MS);
    },
    [save],
  );

  // A pending save must not be lost to a navigation.
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  const commit = useCallback(
    (next: string[]) => {
      setItems(next);
      scheduleSave(next);
    },
    [scheduleSave],
  );

  const add = useCallback(
    (label: string) => {
      const trimmed = label.trim();
      if (trimmed.length === 0) return;
      // Matches the server's rule, so what is on screen is what gets stored.
      if (items.some((item) => item.toLowerCase() === trimmed.toLowerCase())) return;
      commit([...items, trimmed]);
    },
    [items, commit],
  );

  const addMany = useCallback(
    (labels: readonly string[]) => {
      const seen = new Set(items.map((item) => item.toLowerCase()));
      const fresh = labels
        .map((label) => label.trim())
        .filter((label) => {
          if (label.length === 0) return false;
          const key = label.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      if (fresh.length === 0) return;
      commit([...items, ...fresh]);
    },
    [items, commit],
  );

  const remove = useCallback(
    (label: string) => {
      commit(items.filter((item) => item !== label));
    },
    [items, commit],
  );

  return {
    items,
    recent: data?.recent ?? [],
    isLoading,
    isSaving: save.isPending,
    add,
    addMany,
    remove,
  };
}
