import { ChipInput, type ChipItem } from '@ui/inputs';
import { RecentIngredients, SectionHeader } from '@ui/structure';

interface KitchenBasketProps {
  readonly items: readonly string[];
  readonly recent: readonly string[];
  readonly onAdd: (label: string) => void;
  readonly onRemove: (label: string) => void;
}

/**
 * What is in the kitchen right now, plus the one-tap way to re-add something
 * used before.
 *
 * Recents are a side-effect of past sessions — nobody maintains them — which is
 * the same principle the standing kitchen runs on.
 */
export function KitchenBasket({ items, recent, onAdd, onRemove }: KitchenBasketProps) {
  // The chip id IS the label: ingredients are unique within a basket (the
  // server de-duplicates case-insensitively), so a separate id would be a
  // second thing to keep in sync for no gain.
  const chips: ChipItem[] = items.map((label) => ({ id: label, label, source: 'typed' }));

  return (
    <>
      <SectionHeader title="In your kitchen" count={items.length} className="mb-3" />

      <ChipInput
        items={chips}
        label="Your kitchen"
        onAdd={onAdd}
        onRemove={onRemove}
        placeholder="Rice, tomatoes, chicken…"
      />

      {recent.length > 0 ? (
        <RecentIngredients items={[...recent]} onAdd={onAdd} className="mt-5" />
      ) : null}
    </>
  );
}
