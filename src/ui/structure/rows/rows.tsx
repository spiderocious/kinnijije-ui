import type { ReactNode } from 'react';

import { KoboyoIcon, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';
import { Figure } from '@ui/display';
import { Status } from '@ui/status';
import { Provenance, isApproximate, type RecipeSource } from '@ui/domain';

/**
 * The purpose-built row shapes.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/216-row-recipe.html
 *                                                          217-row-saved.html
 *                                                          218-row-ingredient-have.html
 *                                                          219-row-ingredient-need.html
 *                                                          220-row-step.html
 *                                                          221-row-person.html
 *
 * **The shipped system had one generic row; the domain needs sixteen.** A
 * `ListItem` with fifteen optional props is not a component, it is a config
 * format — and every call site ends up passing a different subset, which is how
 * the same class string got hand-copied across three admin files.
 *
 * Each row is NAMED for what it holds. The trailing slot takes at most ONE
 * control; a second belongs in an action menu.
 */

interface RowShellProps {
  readonly onPress?: () => void;
  /** At most ONE control. */
  readonly trailing?: ReactNode;
  /** From cache — renders with its age. */
  readonly staleLabel?: string;
  /** Gated — dimmed but still readable. */
  readonly locked?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

/** The shared frame. Not exported — rows are reached by name. */
function RowShell({
  onPress,
  trailing,
  staleLabel,
  locked = false,
  className,
  children,
}: RowShellProps) {
  const interactive = onPress !== undefined && !locked;

  const content = (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-3">{children}</div>
      {staleLabel !== undefined && (
        <span className="shrink-0 font-mono text-xs text-ink-4">{staleLabel}</span>
      )}
      {trailing !== undefined && <div className="shrink-0">{trailing}</div>}
    </>
  );

  const classes = cn(
    'flex w-full items-center gap-3 px-pad py-row-y text-left',
    interactive && 'transition-colors duration-fast hover:bg-paper-2',
    // Locked dims but stays legible — it is real data, just gated.
    locked && 'opacity-60',
    className,
  );

  if (interactive) {
    return (
      <li>
        <button
          type="button"
          onClick={onPress}
          className={cn(
            classes,
            'focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_3px_var(--sky-glow)]',
          )}
        >
          {content}
        </button>
      </li>
    );
  }

  return <li className={classes}>{content}</li>;
}

/* ---------- Recipe — the curator's row ---------- */

export interface RecipeRowProps extends Omit<RowShellProps, 'children'> {
  readonly name: string;
  readonly source: RecipeSource;
  readonly minutes: number;
  readonly serves: number;
  readonly status: 'published' | 'draft';
}

/** Photo, name, provenance, time, status — five facts, scannable down a column. */
function RowRecipe({ name, source, minutes, serves, status, ...shell }: RecipeRowProps) {
  return (
    <RowShell {...shell}>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-blade-xs border border-line-2 bg-dish-fill text-dish-line">
        <KoboyoIcon name="plateJollofRice" size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-ink">{name}</span>
        <span className="mt-[2px] flex flex-wrap items-center gap-2">
          <Provenance source={source} size="sm" />
          <span className="font-mono text-xs text-ink-3">
            <Figure value={minutes} unit="min" approximate={isApproximate(source)} size="sm" />
            {' · serves '}
            {serves}
          </span>
        </span>
      </span>
      <Status kind="recipe" value={status} size="sm" />
    </RowShell>
  );
}

/* ---------- Ingredient — have / need ---------- */

export interface IngredientRowProps extends Omit<RowShellProps, 'children'> {
  readonly name: string;
  /** "3 cups" */
  readonly quantity: string;
  /** An uncertain match from a photo extraction. */
  readonly maybe?: boolean;
}

/** Already in the kitchen. Green, with the quantity the recipe wants. */
function RowIngredientHave({ name, quantity, ...shell }: IngredientRowProps) {
  return (
    <RowShell {...shell}>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-round bg-success-soft text-success-onsoft">
        <KoboyoIcon name="tick" size={15} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-ink">{name}</span>
        <span className="text-xs text-ink-3">{quantity} · you have this</span>
      </span>
      <Status kind="have-need" value="you_have_it" size="sm" />
    </RowShell>
  );
}

/** Not in the kitchen. **Grey, not red — shopping is not a failure.** */
function RowIngredientNeed({ name, quantity, maybe = false, ...shell }: IngredientRowProps) {
  return (
    <RowShell {...shell}>
      <span
        className={cn(
          'grid h-8 w-8 shrink-0 place-items-center rounded-round',
          maybe ? 'bg-caution-soft text-caution-onsoft' : 'bg-neutral-soft text-neutral-onsoft',
        )}
      >
        <KoboyoIcon name={maybe ? 'solidWarning' : 'shoppingBasket'} size={15} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-ink">{name}</span>
        <span className="text-xs text-ink-3">
          {quantity}
          {maybe ? ' · we are not sure' : ' · add to your market list'}
        </span>
      </span>
      <Status kind="have-need" value={maybe ? 'maybe' : 'you_need_it'} size="sm" />
    </RowShell>
  );
}

/* ---------- Step — a cooking instruction ---------- */

export interface StepRowProps extends Omit<RowShellProps, 'children'> {
  readonly index: number;
  readonly instruction: string;
  readonly done?: boolean;
  /** A step with a timer shows it inline. */
  readonly minutes?: number;
}

function RowStep({ index, instruction, done = false, minutes, ...shell }: StepRowProps) {
  return (
    <RowShell {...shell}>
      <span
        className={cn(
          'grid h-8 w-8 shrink-0 place-items-center rounded-blade-xs border font-mono text-sm font-bold tnum',
          done
            ? 'border-success-border bg-success-soft text-success-onsoft'
            : 'border-ink bg-white text-ink',
        )}
      >
        {done ? <KoboyoIcon name="tick" size={15} /> : index}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-ctrl', done ? 'text-ink-3 line-through' : 'text-ink')}>
          {instruction}
        </span>
      </span>
      {minutes !== undefined && (
        <span className="flex shrink-0 items-center gap-1 text-ink-3">
          <KoboyoIcon name="kitchenTimer" size={14} />
          <Figure value={minutes} unit="min" size="sm" muted />
        </span>
      )}
    </RowShell>
  );
}

/* ---------- Person — the curator's user row ---------- */

export interface PersonRowProps extends Omit<RowShellProps, 'children'> {
  readonly name: string;
  readonly email: string;
  readonly role: 'admin' | 'user';
  readonly status: 'active' | 'suspended';
  /** A blobatar, passed in so the row does not depend on the avatar module. */
  readonly avatar?: ReactNode;
}

function RowPerson({ name, email, role, status, avatar, ...shell }: PersonRowProps) {
  return (
    <RowShell {...shell}>
      {avatar !== undefined && <span className="shrink-0">{avatar}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-ink">{name}</span>
        <span className="block truncate font-mono text-xs text-ink-3">{email}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <Status kind="role" value={role} size="sm" />
        <Status kind="user" value={status} size="sm" />
      </span>
    </RowShell>
  );
}

/* ---------- Market — a shopping-list line ---------- */

export interface MarketRowProps extends Omit<RowShellProps, 'children'> {
  readonly name: string;
  readonly quantity: string;
  readonly ticked: boolean;
  readonly onToggle: (ticked: boolean) => void;
  /** Ticking a market item is what tops the pantry back up. */
  readonly icon?: KoboyoIconName;
}

/** Visual spec: design-system/projects/kinnijije-v2/preview/408-row-market.html */
function RowMarket({ name, quantity, ticked, onToggle, icon = 'shoppingBasket', ...shell }: MarketRowProps) {
  return (
    <RowShell {...shell}>
      <button
        type="button"
        role="checkbox"
        aria-checked={ticked}
        aria-label={`Mark ${name} as bought`}
        onClick={() => onToggle(!ticked)}
        className={cn(
          'grid h-[22px] w-[22px] shrink-0 place-items-center rounded-blade-xs border-bold transition-all duration-fast',
          'focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--sky-glow)]',
          ticked ? 'border-ink bg-sky text-sky-onbase' : 'border-line-2 bg-white',
        )}
      >
        {ticked && <KoboyoIcon name="tick" size={13} />}
      </button>
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate font-semibold', ticked ? 'text-ink-3 line-through' : 'text-ink')}>
          {name}
        </span>
        <span className="text-xs text-ink-3">{quantity}</span>
      </span>
      <KoboyoIcon name={icon} size={17} className="shrink-0 text-ink-4" />
    </RowShell>
  );
}

/** Row-shaped, at the true measure. */
function RowSkeleton({ withAvatar = true }: { readonly withAvatar?: boolean }) {
  return (
    <li aria-hidden="true" className="flex items-center gap-3 px-pad py-row-y">
      {withAvatar && <span className="h-11 w-11 shrink-0 animate-shimmer rounded-blade-xs bg-skeleton" />}
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="h-[16px] w-1/2 animate-shimmer rounded-[4px] bg-skeleton" />
        <span className="h-[13px] w-1/3 animate-shimmer rounded-[4px] bg-skeleton" />
      </span>
      <span className="h-[22px] w-[72px] shrink-0 animate-shimmer rounded-blade-xs bg-skeleton" />
    </li>
  );
}

/** Visual spec: design-system/projects/kinnijije-v2/preview/225-row-notification.html */
/** Visual spec: design-system/projects/kinnijije-v2/preview/226-row-cuisine.html */
/** Visual spec: design-system/projects/kinnijije-v2/preview/227-row-recent.html */
/** Visual spec: design-system/projects/kinnijije-v2/preview/228-row-market.html */
/** Visual spec: design-system/projects/kinnijije-v2/preview/229-row-extraction.html */
/** Visual spec: design-system/projects/kinnijije-v2/preview/230-row-session.html */
/** Visual spec: design-system/projects/kinnijije-v2/preview/231-row-nutrition.html */
export const Row = {
  Recipe: RowRecipe,
  IngredientHave: RowIngredientHave,
  IngredientNeed: RowIngredientNeed,
  Step: RowStep,
  Person: RowPerson,
  Market: RowMarket,
  Skeleton: RowSkeleton,
};
