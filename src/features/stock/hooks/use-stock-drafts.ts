import { useCallback, useState } from 'react';

import type { IngredientSuggestion, StockDraft } from '../types/stock.types';

let counter = 0;
const nextKey = (): string => {
  counter += 1;
  return `draft-${String(counter)}`;
};

/**
 * The working list, shared by every way of getting ingredients in.
 *
 * Typing, photographing and reading a receipt all produce drafts, and all land
 * in the same confirm step — which is what makes the flow reusable rather than
 * three near-identical screens.
 */
export function useStockDrafts(initial: StockDraft[] = []) {
  const [drafts, setDrafts] = useState<StockDraft[]>(initial);

  const addFromSuggestion = useCallback((suggestion: IngredientSuggestion) => {
    setDrafts((current) => {
      // Adding the same thing twice bumps it rather than making a second row —
      // matching what the server does on save.
      const existing = current.find((d) => d.catalogue_id === suggestion.catalogue_id);
      if (existing !== undefined) {
        return current.map((d) =>
          d.key === existing.key ? { ...d, quantity: d.quantity + 1 } : d,
        );
      }

      return [
        ...current,
        {
          key: nextKey(),
          catalogue_id: suggestion.catalogue_id,
          name: suggestion.name,
          quantity: 1,
          unit: suggestion.default_unit,
          units: suggestion.units,
          icon: suggestion.icon,
          recognised: true,
        },
      ];
    });
  }, []);

  const addCustom = useCallback((name: string) => {
    setDrafts((current) => {
      const existing = current.find((d) => d.name.toLowerCase() === name.toLowerCase());
      if (existing !== undefined) {
        return current.map((d) => (d.key === existing.key ? { ...d, quantity: d.quantity + 1 } : d));
      }

      return [
        ...current,
        {
          key: nextKey(),
          catalogue_id: null,
          name,
          quantity: 1,
          // Nothing is known about a custom item, so it gets the most neutral
          // unit and the offer of the common ones.
          unit: 'piece',
          units: ['piece', 'kg', 'g', 'bunch', 'bottle', 'congo', 'derica'],
          icon: 'basket',
          recognised: false,
        },
      ];
    });
  }, []);

  /** Seeds the list from a photo or receipt read. */
  const replaceAll = useCallback((next: StockDraft[]) => {
    setDrafts(next.map((draft) => ({ ...draft, key: draft.key.length > 0 ? draft.key : nextKey() })));
  }, []);

  const update = useCallback((key: string, changes: Partial<StockDraft>) => {
    setDrafts((current) => current.map((d) => (d.key === key ? { ...d, ...changes } : d)));
  }, []);

  const remove = useCallback((key: string) => {
    setDrafts((current) => current.filter((d) => d.key !== key));
  }, []);

  const clear = useCallback(() => {
    setDrafts([]);
  }, []);

  return { drafts, addFromSuggestion, addCustom, replaceAll, update, remove, clear };
}
