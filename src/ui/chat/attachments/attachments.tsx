import { Repeat, Show } from 'meemaw';

import { cn } from '@shared/utils/cn';
import { MealCard, type MatchStrength } from '@ui/domain';
import type { RecipeSource } from '@ui/domain';
import { StockItem, type StockLevel, type StorageKind } from '@ui/stock';
import { Panel } from '@ui/structure';

/**
 * What an AI answer can attach.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/424-chat-suggestion.html
 *                                                          426-chat-meal.html
 *                                                          427-chat-stock.html
 *
 * Extracted from the chat scenes, which had inlined all three. **A scene that
 * inlines a component is a component that will drift** — and these three are
 * exactly the surfaces where the product makes a claim, so drift here costs the
 * most.
 *
 * Each attachment renders the SAME component the rest of the app uses, so an
 * answer cannot show a meal in a treatment the meals screen does not ship.
 */

export interface ChatMealAttachment {
  readonly name: string;
  readonly source: RecipeSource;
  readonly minutes: number;
  readonly match: MatchStrength;
}

export interface ChatMealProps {
  readonly meals: readonly ChatMealAttachment[];
  readonly onOpen?: (name: string) => void;
  readonly className?: string;
}

/** Meals, inline in an answer. The real card, compact. */
/** Visual spec: design-system/projects/kinnijije-v2/preview/426-chat-meal.html */
export function ChatMeal({ meals, onOpen, className }: ChatMealProps) {
  // Nothing matched — prose, no card. An empty card rail beneath an answer
  // reads as "here are your results" pointing at nothing.
  if (meals.length === 0) return null;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Repeat each={[...meals]}>
        {(meal: ChatMealAttachment) => (
          <MealCard
            key={meal.name}
            name={meal.name}
            source={meal.source}
            minutes={meal.minutes}
            match={meal.match}
            compact
            onOpen={onOpen === undefined ? undefined : () => onOpen(meal.name)}
          />
        )}
      </Repeat>
    </div>
  );
}

export interface ChatStockItem {
  readonly name: string;
  readonly level: StockLevel;
  readonly quantity: number;
  readonly unit: string;
  readonly storage?: StorageKind;
}

export interface ChatStockProps {
  readonly items: readonly ChatStockItem[];
  /** When the count was taken — the answer's citation says the same. */
  readonly countedAt?: string;
  readonly className?: string;
}

/** A stock readout, inline in an answer. */
/** Visual spec: design-system/projects/kinnijije-v2/preview/427-chat-stock.html */
export function ChatStock({ items, countedAt, className }: ChatStockProps) {
  return (
    <Panel className={className}>
      <Show when={countedAt !== undefined}>
        <Panel.Header title="From your kitchen" action={
          <span className="font-mono text-xs text-ink-3">{countedAt}</span>
        } />
      </Show>
      <Panel.List>
        <Repeat each={[...items]}>
          {(item: ChatStockItem) => (
            <StockItem
              key={item.name}
              name={item.name}
              level={item.level}
              quantity={item.quantity}
              unit={item.unit}
              storage={item.storage}
            />
          )}
        </Repeat>
      </Panel.List>
    </Panel>
  );
}

export interface ChatSuggestionProps {
  readonly suggestions: readonly string[];
  readonly onSelect: (suggestion: string) => void;
  /** Deriving them. The row holds its height so the composer does not jump. */
  readonly loading?: boolean;
  /** Prompts already asked this session — shown, but not offered again. */
  readonly asked?: readonly string[];
  readonly className?: string;
}

/**
 * Starter prompts, on an empty thread.
 *
 * **They vanish once the conversation starts** — a suggestion offered beside an
 * answer competes with the follow-ups that answer earned.
 */
export function ChatSuggestion({
  suggestions,
  onSelect,
  loading = false,
  asked = [],
  className,
}: ChatSuggestionProps) {
  if (loading) {
    return (
      <div aria-hidden="true" className={cn('flex flex-wrap gap-2', className)}>
        {[132, 108, 156].map((width) => (
          <span
            key={width}
            className="block h-ctrl-sm animate-shimmer rounded-pill bg-skeleton"
            style={{ width }}
          />
        ))}
      </div>
    );
  }

  // Nothing obvious to ask next — the row collapses rather than padding itself
  // with generic prompts, which is how a suggestion strip stops being read.
  if (suggestions.length === 0) return null;

  return (
    <ul className={cn('flex flex-wrap gap-2', className)}>
      <Repeat each={[...suggestions]}>
        {(suggestion: string) => {
          // Already asked: still shown, so the user can see they covered it,
          // but not offered again — re-asking returns the same answer.
          const alreadyAsked = asked.includes(suggestion);
          return (
            <li key={suggestion}>
              <button
                type="button"
                disabled={alreadyAsked}
                onClick={() => onSelect(suggestion)}
                className={cn(
                  'rounded-pill border border-line-2 bg-white px-3 py-[6px] text-xs font-extrabold text-ink-2 transition-colors duration-fast focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]',
                  alreadyAsked
                    ? 'cursor-not-allowed opacity-[0.42]'
                    : 'hover:border-sky-edge hover:bg-sky-soft hover:text-sky-on',
                )}
              >
                {suggestion}
              </button>
            </li>
          );
        }}
      </Repeat>
    </ul>
  );
}

/**
 * The recipe failed to attach.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/426-chat-meal.html
 *
 * **The answer above it stays.** The assistant said something useful and only
 * the card failed; discarding the whole turn to report an attachment error
 * throws away the part that worked.
 */
export function ChatMealError({
  onRetry,
  className,
}: {
  readonly onRetry?: () => void;
  readonly className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-blade-sm border border-dashed border-line-2 px-3 py-2 text-sm text-ink-3',
        className,
      )}
    >
      The recipe card could not load.
      {onRetry !== undefined && (
        <button
          type="button"
          onClick={onRetry}
          className="ml-2 font-extrabold text-sky hover:underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}
