import { Show } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { cn } from '@shared/utils/cn';
import { Button } from '@ui/primitives';
import { Figure } from '@ui/display';
import { Status } from '@ui/status';
import { Provenance, isApproximate, type RecipeSource } from '../provenance/provenance';
import type { HeroImageKind } from '../meal-card/meal-card';

/**
 * The recipe screen's hero.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/260-recipe-hero.html
 *
 * **Provenance sits ON the photo, exactly as it does on the card.** The shipped
 * app demoted it to a pale outlined pill here, which is how one recipe grew two
 * different Verified badges — the same fact rendered two ways on two screens.
 *
 * Extracted from `RecipeScene`, which had inlined it. A scene that inlines a
 * component is a component that will drift.
 */

export interface RecipeHeroProps {
  readonly name: string;
  /** REQUIRED — the same contract as the meal card. */
  readonly source: RecipeSource;
  readonly minutes: number;
  readonly serves: number;
  readonly difficulty: 'easy' | 'medium' | 'involved';
  readonly heroImage?: { readonly kind: HeroImageKind; readonly src?: string };
  /** Taller on desktop, where there is room for it. */
  readonly size?: 'compact' | 'full';
  readonly className?: string;
}

export function RecipeHero({
  name,
  source,
  minutes,
  serves,
  difficulty,
  heroImage = { kind: 'placeholder' },
  size = 'compact',
  className,
}: RecipeHeroProps) {
  // Derived, never passed — the time and the badge cannot disagree.
  const approximate = isApproximate(source);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-blade-lg border-bold border-ink shadow-drop',
        className,
      )}
    >
      <div
        className={cn(
          'relative grid place-items-center bg-dish-fill text-dish-line',
          size === 'compact' ? 'h-[200px]' : 'h-[280px]',
        )}
      >
        {heroImage.src !== undefined ? (
          <img src={heroImage.src} alt={name} className="h-full w-full object-cover" />
        ) : (
          <KoboyoIcon
            name="plateJollofRice"
            size={size === 'compact' ? 64 : 88}
            alone
          />
        )}

        {/* On the photo — the same treatment as the card. */}
        <span className="absolute bottom-3 left-3">
          <Provenance source={source} />
        </span>

        {/* A generated image always carries its tag. */}
        <Show when={heroImage.kind === 'ai_image'}>
          <span className="absolute bottom-3 right-3 rounded-blade-xs border border-grape-border bg-grape-soft px-2 py-[2px] text-xs font-extrabold text-grape-onsoft">
            AI image
          </span>
        </Show>
      </div>

      <div className="bg-white p-4">
        <h1
          className={cn(
            'font-display font-extrabold leading-tight tracking-display',
            size === 'compact' ? 'text-2xl' : 'text-3xl',
          )}
        >
          {name}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Figure value={minutes} unit="min" approximate={approximate} />
          <Figure value={serves} unit="serves" muted />
          <Status kind="difficulty" value={difficulty} size="sm" />
        </div>
      </div>
    </div>
  );
}

/** Hero box, title, meta row — at the true measure. */
export function RecipeHeroSkeleton({ size = 'compact' }: { readonly size?: 'compact' | 'full' }) {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-blade-lg border-bold border-line-2"
    >
      <div
        className={cn('animate-shimmer bg-skeleton', size === 'compact' ? 'h-[200px]' : 'h-[280px]')}
      />
      <div className="bg-white p-4">
        <div className="h-[28px] w-4/5 animate-shimmer rounded-[4px] bg-skeleton" />
        <div className="mt-3 flex gap-3">
          <div className="h-[22px] w-[70px] animate-shimmer rounded-[4px] bg-skeleton" />
          <div className="h-[22px] w-[80px] animate-shimmer rounded-[4px] bg-skeleton" />
        </div>
      </div>
    </div>
  );
}

/**
 * The recipe failed to load.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/260-recipe-hero.html
 *
 * Keeps the hero's box so the page beneath does not leap upward, and offers a
 * retry — a recipe that failed once usually loads on the second try, and the
 * alternative is sending the user back to a list they already left.
 */
export function RecipeHeroError({
  onRetry,
  onBack,
  className,
}: {
  readonly onRetry?: () => void;
  readonly onBack?: () => void;
  readonly className?: string;
}) {
  return (
    <div
      className={cn(
        'grid min-h-[220px] place-items-center rounded-blade-lg border-bold border-line-2 bg-paper-2 p-6 text-center',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <p className="font-display text-lg font-extrabold tracking-display">
          This recipe could not load
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {onRetry !== undefined && (
            <Button size="sm" onClick={onRetry}>
              Try again
            </Button>
          )}
          {onBack !== undefined && (
            <Button size="sm" variant="secondary" onClick={onBack}>
              Back to suggestions
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
