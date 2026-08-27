import { Repeat } from 'meemaw';

import { cn } from '@shared/utils/cn';
import { FilterChip } from '@ui/primitives';

import { DIFFICULTY_OPTIONS } from '../content/onboarding.content';

interface TasteStepProps {
  readonly availableCuisines: readonly string[];
  readonly selectedCuisines: readonly string[];
  readonly onToggleCuisine: (cuisine: string) => void;
  readonly difficulty: string;
  readonly onDifficultyChange: (difficulty: 'easy' | 'medium' | 'anything') => void;
}

/**
 * Taste preferences.
 *
 * These are real signal, not a formality: the suggestion engine treats cuisine
 * as a HARD filter, so someone who picks only Asian must never be shown egusi.
 * Nigerian and West African are pre-selected because that is the product's
 * stated point of view — the step is skippable precisely because the defaults
 * are a genuine answer rather than a placeholder.
 */
export function TasteStep({
  availableCuisines,
  selectedCuisines,
  onToggleCuisine,
  difficulty,
  onDifficultyChange,
}: TasteStepProps) {
  return (
    <div className="flex flex-col gap-7">
      <header>
        <h1 className="font-display text-2xl font-extrabold leading-tight tracking-display sm:text-3xl">
          What do you like to cook?
        </h1>
        <p className="mt-2 text-md text-ink-2">
          This filters what you are shown, so pick honestly. You can change it later.
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-xs font-extrabold uppercase tracking-overline text-ink-3">
          Cuisines
        </h2>
        <div className="flex flex-wrap gap-2">
          <Repeat each={[...availableCuisines]}>
            {(cuisine: string) => (
              <FilterChip
                key={cuisine}
                pressed={selectedCuisines.includes(cuisine)}
                onPressedChange={() => {
                  onToggleCuisine(cuisine);
                }}
              >
                {cuisine}
              </FilterChip>
            )}
          </Repeat>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-extrabold uppercase tracking-overline text-ink-3">
          How adventurous?
        </h2>
        <div role="radiogroup" aria-label="How adventurous?" className="flex flex-col gap-2">
          <Repeat each={[...DIFFICULTY_OPTIONS]}>
            {(option: (typeof DIFFICULTY_OPTIONS)[number]) => (
              // A real radio, not a clickable div: Card is presentational and
              // takes no onClick, and a div would be invisible to a keyboard
              // and to a screen reader.
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={difficulty === option.value}
                onClick={() => {
                  onDifficultyChange(option.value);
                }}
                className={cn(
                  'rounded-blade border-2 p-4 text-left transition-colors',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky',
                  difficulty === option.value
                    ? 'border-sky bg-sky-soft'
                    : 'border-line hover:border-ink-3',
                )}
              >
                <p className="text-sm font-extrabold text-ink">{option.label}</p>
                <p className="mt-0.5 text-sm text-ink-2">{option.body}</p>
              </button>
            )}
          </Repeat>
        </div>
      </section>
    </div>
  );
}
