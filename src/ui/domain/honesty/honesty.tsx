import { Repeat, Show } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { cn } from '@shared/utils/cn';
import { Button } from '@ui/primitives';
import { Status } from '@ui/status';
import { Provenance, isApproximate, type RecipeSource } from '../provenance/provenance';
import type { HeroImageKind } from '../meal-card/meal-card';

/**
 * The full trust disclosure — three axes, all of them rendered.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/291-honesty-bar.html
 *                                                          292-ai-disclosure.html
 *                                                          293-why-this-meal.html
 *
 * Every honesty signal a recipe carries, in one place: **who wrote it**, **where
 * the photo came from**, and **whether the quantities are exact**.
 *
 * Three axes the database models and the shipped app rendered ONE of — a cook
 * could be looking at an AI-generated image beside a Verified badge with no way
 * to tell.
 */

export interface HonestyBarProps {
  readonly source: RecipeSource;
  readonly imageKind: HeroImageKind;
  /** Optional link to the testing policy. */
  readonly onExplain?: () => void;
  readonly className?: string;
}

export function HonestyBar({ source, imageKind, onExplain, className }: HonestyBarProps) {
  const approximate = isApproximate(source);
  // Fully verified with a real photo — the bar collapses to one line, because
  // three green rows saying "all good" is noise.
  const fullyVerified = source === 'seed' && imageKind === 'photo';

  if (fullyVerified) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-blade border border-success-border bg-success-soft px-4 py-3',
          className,
        )}
      >
        <KoboyoIcon name="tick" size={18} className="shrink-0 text-success-onsoft" />
        <p className="text-sm font-extrabold text-success-onsoft">
          ✓ Verified — tested by a person, real photo, exact quantities.
        </p>
      </div>
    );
  }

  const rows = [
    { label: 'Recipe', node: <Provenance source={source} size="sm" /> },
    { label: 'Photo', node: <Status kind="hero-image" value={imageKind} size="sm" /> },
    {
      label: 'Quantities',
      node: (
        <Status kind="approximate" value={approximate ? 'approximate' : 'exact'} size="sm" />
      ),
    },
  ];

  return (
    <div className={cn('rounded-blade border border-line-2 bg-white p-4', className)}>
      <p className="mb-3 text-xs font-extrabold uppercase tracking-overline text-ink-3">
        How we made this
      </p>

      <dl className="flex flex-col gap-2">
        <Repeat each={rows}>
          {(row: { label: string; node: React.ReactNode }) => (
            <div key={row.label} className="flex items-center justify-between gap-3">
              <dt className="text-sm text-ink-2">{row.label}</dt>
              <dd>{row.node}</dd>
            </div>
          )}
        </Repeat>
      </dl>

      <Show when={onExplain !== undefined}>
        <button
          type="button"
          onClick={onExplain}
          className="mt-3 text-sm font-extrabold text-sky-on underline decoration-2 underline-offset-2 hover:text-sky-deep"
        >
          How we test recipes
        </button>
      </Show>
    </div>
  );
}

export interface AiDisclosureProps {
  readonly onClose?: () => void;
  readonly className?: string;
}

/**
 * The long-form AI explanation, reachable from EVERY AI mark.
 *
 * **A badge alone is a claim, not a disclosure.** This says what the model was
 * given, what it was asked, and what the user should treat with caution.
 */
export function AiDisclosure({ onClose, className }: AiDisclosureProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-blade-xs bg-grape-soft text-grape-onsoft">
          <KoboyoIcon name="robotForAi" size={22} />
        </span>
        <h2 className="font-display text-xl font-extrabold tracking-display">Made by AI</h2>
      </div>

      <p className="text-base text-ink-2">
        No tested recipe matched your ingredients closely enough, so we asked a model to write one.
        It was told to cook Nigerian-first, use what you have, and keep the steps achievable.
      </p>

      <ul className="flex flex-col gap-2">
        <li className="flex items-start gap-2 text-base text-ink-2">
          <KoboyoIcon name="solidWarning" size={17} className="mt-[3px] shrink-0 text-caution" />
          Quantities are estimates — taste as you go.
        </li>
        <li className="flex items-start gap-2 text-base text-ink-2">
          <KoboyoIcon name="alarmClock" size={17} className="mt-[3px] shrink-0 text-caution" />
          The cook time is padded by 30%, because models under-estimate.
        </li>
        <li className="flex items-start gap-2 text-base text-ink-2">
          <KoboyoIcon name="reportFlag" size={17} className="mt-[3px] shrink-0 text-ink-3" />
          Flag anything wrong and a person will check it.
        </li>
      </ul>

      <Button className="self-start" onClick={onClose}>
        Got it
      </Button>
    </div>
  );
}

export interface WhyThisMealProps {
  /** The ingredients that actually matched. Evidence, not marketing. */
  readonly matched: readonly string[];
  readonly totalInBasket: number;
  /** Other reasons the engine gave — cuisine, difficulty. */
  readonly reasons?: readonly string[];
  /** An AI recipe matched nothing, and it says so plainly. */
  readonly noMatch?: boolean;
  readonly className?: string;
}

/**
 * The suggestion rationale, which makes the engine's reasoning inspectable.
 *
 * **It names the MATCHED ingredients** — a rationale with no evidence is
 * marketing, and a suggestion nobody can audit is one nobody can report.
 */
export function WhyThisMeal({
  matched,
  totalInBasket,
  reasons = [],
  noMatch = false,
  className,
}: WhyThisMealProps) {
  return (
    <div className={cn('rounded-blade border border-line-2 bg-paper-2 p-4', className)}>
      <p className="mb-2 font-display text-md font-extrabold tracking-display">Why this meal?</p>

      <Show when={noMatch}>
        <p className="text-sm text-ink-2">
          Nothing you have matched a tested recipe, so we asked a model to write something around
          your ingredients.
        </p>
      </Show>

      <Show when={!noMatch}>
        <p className="text-sm text-ink-2">
          It uses <b className="font-extrabold text-ink">{matched.length}</b> of the{' '}
          <b className="font-extrabold text-ink">{totalInBasket}</b> things you have
          {reasons.length > 0 && <>, {reasons.join(', and ')}</>}.
        </p>

        {/* The evidence — named, not summarised. */}
        <ul className="mt-3 flex flex-wrap gap-2">
          <Repeat each={[...matched]}>
            {(item: string) => (
              <li
                key={item}
                className="rounded-blade-xs border border-success-border bg-success-soft px-[10px] py-1 text-xs font-extrabold text-success-onsoft"
              >
                {item}
              </li>
            )}
          </Repeat>
        </ul>
      </Show>
    </div>
  );
}
