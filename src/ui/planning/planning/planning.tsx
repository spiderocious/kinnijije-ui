import { Repeat, Show } from 'meemaw';

import { KoboyoIcon, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';
import { Figure } from '@ui/display';
import { Button } from '@ui/primitives';
import { Stepper } from '@ui/inputs';
import { isApproximate, type RecipeSource } from '@ui/domain';

/**
 * Planning — mood, constraints, the week, and portions.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/460-mood-picker.html
 *                                                          461-constraint-chip.html
 *                                                          462-meal-slot.html
 *                                                          463-day-column.html
 *                                                          465-portion-scaler.html
 */

/* ---------- Mood ---------- */

export interface Mood {
  readonly id: string;
  readonly label: string;
  readonly icon: KoboyoIconName;
}

export const MOODS: readonly Mood[] = [
  { id: 'quick', label: 'Something quick', icon: 'alarmClock' },
  { id: 'comfort', label: 'Comfort food', icon: 'bowlSoup' },
  { id: 'light', label: 'Light', icon: 'seedling' },
  { id: 'peppery', label: 'Peppery', icon: 'chilli' },
  { id: 'new', label: 'Something new', icon: 'sparkle' },
  { id: 'cheap', label: 'Cheap', icon: 'purse' },
];

export interface MoodPickerProps {
  /** Multi-select — "quick AND peppery" is a real request. */
  readonly value: readonly string[];
  readonly onChange: (value: readonly string[]) => void;
  readonly moods?: readonly Mood[];
  /** Fewer than two things in the kitchen to work with. */
  readonly disabledReason?: string;
  readonly className?: string;
}

/**
 * The taste-led way in, as opposed to the ingredient-led one.
 *
 * **Mood narrows, it never overrides.** A cook who picks "comfort food" with an
 * empty kitchen still gets what is makeable — the mood reorders the results, it
 * does not invent ingredients.
 *
 * Picking nothing is VALID, and the copy says what that means.
 */
export function MoodPicker({
  value,
  onChange,
  moods = MOODS,
  disabledReason,
  className,
}: MoodPickerProps) {
  const disabled = disabledReason !== undefined;

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  return (
    <div className={className}>
      <div
        className={cn(
          'grid grid-cols-2 gap-3 sm:grid-cols-3',
          disabled && 'pointer-events-none opacity-[0.42]',
        )}
      >
        <Repeat each={[...moods]}>
          {(mood: Mood) => {
            const picked = value.includes(mood.id);
            return (
              <button
                key={mood.id}
                type="button"
                aria-pressed={picked}
                onClick={() => toggle(mood.id)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-blade border-bold px-3 py-4',
                  'text-sm font-extrabold transition-colors duration-fast',
                  'focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--sky-glow)]',
                  picked
                    ? 'border-ink bg-sky text-sky-onbase shadow-drop-sm'
                    : 'border-line-2 bg-white text-ink-2 hover:border-sky-edge hover:bg-sky-soft',
                )}
              >
                <KoboyoIcon name={mood.icon} size={26} />
                {mood.label}
              </button>
            );
          }}
        </Repeat>
      </div>

      <Show when={disabled}>
        <p className="mt-3 text-sm font-extrabold text-ink-3">{disabledReason}</p>
      </Show>

      {/* Picking nothing is valid — and the copy says what happens. */}
      <Show when={!disabled && value.length === 0}>
        <p className="mt-3 text-sm text-ink-3">
          With nothing picked we will just go by what is in your kitchen.
        </p>
      </Show>
    </div>
  );
}

/* ---------- Constraints ---------- */

export interface ConstraintChipProps {
  readonly label: string;
  readonly active: boolean;
  readonly onToggle: (active: boolean) => void;
  readonly icon?: KoboyoIconName;
}

/** A hard filter — dietary, time, difficulty. Unlike mood, it excludes. */
export function ConstraintChip({ label, active, onToggle, icon }: ConstraintChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onToggle(!active)}
      className={cn(
        'inline-flex items-center gap-2 rounded-pill border px-4 py-2 text-sm font-extrabold',
        'transition-colors duration-fast focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--sky-glow)]',
        active
          ? 'border-ink bg-ink text-ink-inv'
          : 'border-line-2 bg-white text-ink-2 hover:border-ink hover:text-ink',
      )}
    >
      {icon !== undefined && <KoboyoIcon name={icon} size={14} />}
      {label}
    </button>
  );
}

/* ---------- The week plan ---------- */

export interface PlannedMeal {
  readonly name: string;
  readonly minutes: number;
  readonly source: RecipeSource;
}

export interface MealSlotProps {
  readonly day: string;
  readonly meal?: PlannedMeal;
  /** Already cooked — it becomes a record. */
  readonly cooked?: boolean;
  /** The planned recipe was deleted. */
  readonly missing?: boolean;
  readonly onPick?: () => void;
  readonly onClear?: () => void;
}

/**
 * One slot in the week.
 *
 * **Designed empty-first**, because that is what it usually is — most slots in
 * most weeks are empty, so the empty treatment is the one that had to be right.
 * It is calm, not an error.
 */
export function MealSlot({ day, meal, cooked = false, missing = false, onPick, onClear }: MealSlotProps) {
  if (missing) {
    return (
      <div className="rounded-blade border border-caution-border bg-caution-soft p-3">
        <p className="text-xs font-extrabold uppercase tracking-overline text-ink-3">{day}</p>
        <p className="mt-1 text-sm text-caution-onsoft">That recipe is gone.</p>
        <Button variant="secondary" size="sm" className="mt-2" onClick={onPick}>
          Pick another
        </Button>
      </div>
    );
  }

  if (meal === undefined) {
    return (
      <button
        type="button"
        onClick={onPick}
        className={cn(
          'flex min-h-[92px] w-full flex-col rounded-blade border border-dashed border-line-2 bg-paper-2 p-3 text-left',
          'transition-colors hover:border-sky-edge hover:bg-sky-soft',
          'focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]',
        )}
      >
        <span className="text-xs font-extrabold uppercase tracking-overline text-ink-3">{day}</span>
        <span className="mt-auto text-sm text-ink-4">— nothing planned</span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        'flex min-h-[92px] flex-col rounded-blade border p-3',
        cooked ? 'border-success-border bg-success-soft' : 'border-line-2 bg-white',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-extrabold uppercase tracking-overline text-ink-3">{day}</span>
        <Show when={cooked}>
          <span className="flex items-center gap-1 text-xs font-extrabold text-success-onsoft">
            <KoboyoIcon name="tick" size={12} />
            cooked
          </span>
        </Show>
      </div>

      <p className="mt-1 font-display text-sm font-extrabold leading-tight tracking-display">
        {meal.name}
      </p>
      <p className="mt-auto pt-1">
        <Figure
          value={meal.minutes}
          unit="min"
          approximate={isApproximate(meal.source)}
          size="sm"
          muted
        />
      </p>

      <Show when={!cooked && onClear !== undefined}>
        <button
          type="button"
          onClick={onClear}
          className="mt-1 self-start text-xs font-extrabold text-ink-3 underline decoration-2 underline-offset-2 hover:text-critical-onsoft"
        >
          Clear
        </button>
      </Show>
    </div>
  );
}

/* ---------- Portions ---------- */

export interface PortionScalerProps {
  readonly serves: number;
  readonly onChange: (serves: number) => void;
  /** What the recipe was written for. */
  readonly baseServes: number;
  readonly className?: string;
}

/**
 * Scale a recipe up or down.
 *
 * **It states what it was scaled FROM.** A recipe silently rewritten for six
 * gives a cook no way to sanity-check a quantity that looks wrong — and
 * scaling is where recipe maths most often goes astray.
 */
export function PortionScaler({ serves, onChange, baseServes, className }: PortionScalerProps) {
  const scaled = serves !== baseServes;

  return (
    <div className={cn('flex flex-wrap items-center gap-4', className)}>
      <Stepper value={serves} onChange={onChange} label="Serves" min={1} max={40} unit="serves" />

      <Show when={scaled}>
        <p className="text-sm text-ink-3">
          Scaled from <span className="font-mono tnum">{baseServes}</span>. Quantities are
          multiplied by{' '}
          <span className="font-mono tnum">{(serves / baseServes).toFixed(2)}</span>.
        </p>
      </Show>
    </div>
  );
}
