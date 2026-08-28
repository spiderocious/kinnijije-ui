import type { KeyboardEvent } from 'react';

import { KoboyoIcon, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';
import { Button } from '@ui/primitives';
import { Figure } from '@ui/display';
import { Provenance, isApproximate, type RecipeSource } from '../provenance/provenance';

/**
 * The signature object — the thing the whole product exists to show.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/80-meal-card.html
 *                                                          81-meal-card-compact.html
 *
 * **The provenance contract lives here.** Every meal card renders its
 * `source × heroImageKind × approximate` triple in one vocabulary.
 *
 * `source` is a REQUIRED prop, and `approximate` is DERIVED from it rather than
 * passed — so a card cannot claim "Verified" beside a padded time. An
 * unlabelled recipe cannot render, which makes the shipped app's
 * three-different-Verified-labels bug structurally impossible.
 *
 * **A weak match demotes its CTA from primary to secondary**, so the eye lands
 * on the better card without a word of explanation.
 */

export type MatchStrength = 'nothing_to_buy' | 'strong_match' | 'needs_a_shop';
export type HeroImageKind = 'photo' | 'ai_image' | 'placeholder';

export interface MealCardProps {
  readonly name: string;
  /** REQUIRED — an unlabelled recipe cannot render. */
  readonly source: RecipeSource;
  readonly minutes: number;
  /** Drives the banner and the CTA's prominence. */
  readonly match: MatchStrength;
  readonly heroImage?: { readonly kind: HeroImageKind; readonly src?: string };
  /** "Uses 5 of your 6 things" */
  readonly matchLine?: string;
  readonly onOpen?: () => void;
  readonly compact?: boolean;
  /** From cache, offline. Renders with its age. */
  readonly staleLabel?: string;
  /** Suggestions paused by a feature flag. */
  readonly paused?: boolean;
  readonly className?: string;
}

/** The dish family's mark, when there is no photograph. */
const FALLBACK_ICON: Record<HeroImageKind, KoboyoIconName> = {
  photo: 'plateJollofRice',
  ai_image: 'plateJollofRice',
  placeholder: 'cookingPot',
};

function Hero({
  name,
  kind,
  src,
  compact,
}: {
  readonly name: string;
  readonly kind: HeroImageKind;
  readonly src?: string;
  readonly compact: boolean;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden border-b border-ink bg-dish-fill',
        compact ? 'h-[92px] w-[92px] shrink-0 rounded-l-blade border-b-0 border-r' : 'h-[168px]',
      )}
    >
      {src !== undefined ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        // The type-led degrade — honest about being a stand-in.
        <div className="grid h-full place-items-center text-dish-line">
          <KoboyoIcon name={FALLBACK_ICON[kind]} size={compact ? 36 : 56} alone />
        </div>
      )}

      {/* A generated image ALWAYS carries its tag — an unlabelled one is a
          trust bug, and the cook has no other way to tell. */}
      {kind === 'ai_image' && (
        <span className="absolute bottom-2 right-2 rounded-blade-xs border border-grape-border bg-grape-soft px-2 py-[2px] text-xs font-extrabold text-grape-onsoft">
          AI image
        </span>
      )}
    </div>
  );
}

/** Visual spec: design-system/projects/kinnijije-v2/preview/14-photo-fallback.html */
export function MealCard({
  name,
  source,
  minutes,
  match,
  heroImage = { kind: 'placeholder' },
  matchLine,
  onOpen,
  compact = false,
  staleLabel,
  paused = false,
  className,
}: MealCardProps) {
  // Derived, never passed — the two cannot disagree.
  const approximate = isApproximate(source);
  const weak = match === 'needs_a_shop';

  if (compact) {
    // The compact card has no button — it IS the button. Without this it
    // rendered `onOpen` nowhere at all, so a meal in a chat reply looked
    // tappable and did nothing.
    const openable = onOpen !== undefined && !paused;

    return (
      <article
        {...(openable && {
          role: 'button',
          tabIndex: 0,
          onClick: onOpen,
          onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
            // Enter and Space, because this is a button wearing an article.
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onOpen();
            }
          },
          'aria-label': `Open ${name}`,
        })}
        className={cn(
          'flex overflow-hidden rounded-blade border-bold border-ink bg-white shadow-drop-sm',
          openable &&
            'cursor-pointer transition-shadow hover:shadow-drop focus-visible:outline-none focus-visible:shadow-[var(--drop),0_0_0_4px_var(--sky-glow)]',
          className,
        )}
      >
        <Hero name={name} kind={heroImage.kind} src={heroImage.src} compact />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-3">
          <p className="truncate font-display text-md font-extrabold tracking-display">{name}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Provenance source={source} size="sm" />
            <Figure value={minutes} unit="min" approximate={approximate} size="sm" />
          </div>
          {matchLine !== undefined && (
            <p className="truncate text-xs text-ink-2">{matchLine}</p>
          )}
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-blade-lg border-bold border-ink bg-white shadow-drop',
        className,
      )}
    >
      {/* The perfect-match band. Only when nothing is missing. */}
      {match === 'nothing_to_buy' && (
        <p className="flex items-center gap-2 border-b border-ink bg-success-soft px-4 py-2 text-sm font-extrabold text-success-onsoft">
          <KoboyoIcon name="tick" size={14} />
          Cook it now — nothing to buy
        </p>
      )}

      <Hero name={name} kind={heroImage.kind} src={heroImage.src} compact={false} />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 font-display text-lg font-extrabold leading-tight tracking-display">
          {name}
        </h3>

        {/* The required slot. Always present, always the same words. */}
        <div className="flex flex-wrap items-center gap-2">
          <Provenance source={source} />
          <Figure value={minutes} unit="min" approximate={approximate} />
        </div>

        {matchLine !== undefined && <p className="text-sm text-ink-2">{matchLine}</p>}

        {staleLabel !== undefined && (
          <p className="flex items-center gap-2 text-xs font-extrabold text-ink-3">
            <KoboyoIcon name="offlineCache" size={13} />
            {staleLabel}
          </p>
        )}

        <div className="mt-auto pt-1">
          {paused ? (
            <Button variant="secondary" fullWidth disabled>
              Paused
            </Button>
          ) : (
            // A weak match demotes the CTA — the only signal, deliberately quiet.
            <Button variant={weak ? 'secondary' : 'primary'} fullWidth onClick={onOpen}>
              Open recipe
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

/** A skeleton mirroring this exact card — banner, photo, title, tag row, button. */
export function MealCardSkeleton({ compact = false }: { readonly compact?: boolean }) {
  if (compact) {
    return (
      <div
        aria-hidden="true"
        className="flex overflow-hidden rounded-blade border-bold border-line-2 bg-white"
      >
        <div className="h-[92px] w-[92px] shrink-0 animate-shimmer bg-skeleton" />
        <div className="flex flex-1 flex-col justify-center gap-2 p-3">
          <div className="h-[18px] w-3/4 animate-shimmer rounded-[4px] bg-skeleton" />
          <div className="h-[20px] w-1/2 animate-shimmer rounded-[4px] bg-skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="flex flex-col overflow-hidden rounded-blade-lg border-bold border-line-2 bg-white"
    >
      <div className="h-[168px] animate-shimmer bg-skeleton" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-[24px] w-4/5 animate-shimmer rounded-[4px] bg-skeleton" />
        <div className="flex gap-2">
          <div className="h-[26px] w-[104px] animate-shimmer rounded-blade-xs bg-skeleton" />
          <div className="h-[26px] w-[70px] animate-shimmer rounded-blade-xs bg-skeleton" />
        </div>
        <div className="h-ctrl w-full animate-shimmer rounded-blade-lg bg-skeleton" />
      </div>
    </div>
  );
}

/** This card failed to resolve; its siblings are unaffected. */
export function MealCardError({ onRetry }: { readonly onRetry?: () => void }) {
  return (
    <article className="flex flex-col items-start gap-3 rounded-blade-lg border-bold border-critical-border bg-critical-soft p-5">
      <KoboyoIcon name="error" size={28} className="text-critical" alone />
      <p className="font-display text-md font-extrabold text-critical-onsoft">
        Could not load this meal
      </p>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </article>
  );
}
