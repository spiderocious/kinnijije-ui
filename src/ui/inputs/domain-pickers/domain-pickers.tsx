import { Repeat, Show } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { cn } from '@shared/utils/cn';
import { STATUS_REGISTRY } from '@ui/status';

/**
 * The domain-specific pickers.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/67-cuisine-picker.html
 *                                                          68-difficulty-picker.html
 *                                                          69-measurement-toggle.html
 *
 * Each of these reads its labels from `STATUS_REGISTRY` rather than restating
 * them, so a preference control and the status pill that reports it cannot
 * drift apart — which is exactly how the shipped app ended up printing the raw
 * enum `anything` in Settings.
 */

/* ---------- Cuisine ---------- */

export const CUISINES = [
  'Nigerian',
  'West African',
  'East African',
  'North African',
  'Caribbean',
  'Chinese',
  'Indian',
  'Italian',
  'Mediterranean',
] as const;

export interface CuisinePickerProps {
  readonly value: readonly string[];
  readonly onChange: (value: readonly string[]) => void;
  readonly options?: readonly string[];
  readonly className?: string;
}

/**
 * **Deselecting everything is VALID** — it means "show me everything", and the
 * copy says so rather than leaving an empty selection looking broken.
 */
export function CuisinePicker({
  value,
  onChange,
  options = CUISINES,
  className,
}: CuisinePickerProps) {
  function toggle(cuisine: string) {
    onChange(value.includes(cuisine) ? value.filter((c) => c !== cuisine) : [...value, cuisine]);
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        <Repeat each={[...options]}>
          {(cuisine: string) => {
            const on = value.includes(cuisine);
            return (
              <button
                key={cuisine}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(cuisine)}
                className={cn(
                  'rounded-pill border px-4 py-2 text-sm font-extrabold transition-colors duration-fast',
                  'focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--sky-glow)]',
                  on
                    ? 'border-ink bg-sky text-sky-onbase'
                    : 'border-line-2 bg-white text-ink-2 hover:border-sky-edge hover:bg-sky-soft',
                )}
              >
                {cuisine}
              </button>
            );
          }}
        </Repeat>
      </div>

      {/* An empty selection is a real choice, not a broken form. */}
      <Show when={value.length === 0}>
        <p className="mt-3 text-sm text-ink-3">
          Nothing picked — we will show you everything.
        </p>
      </Show>
    </div>
  );
}

/* ---------- Difficulty floor ---------- */

export type DifficultyFloor = 'easy' | 'medium' | 'anything';

export interface DifficultyPickerProps {
  readonly value: DifficultyFloor;
  readonly onChange: (value: DifficultyFloor) => void;
  readonly className?: string;
}

/**
 * The USER's tolerance — `easy | medium | anything`.
 *
 * **This is `DifficultyFloor`, not recipe `Difficulty`** (`easy | medium |
 * involved`). The two enums were never reconciled in the shipped system, and
 * Settings leaked the raw value straight to the user. The humanised label lives
 * in `STATUS_REGISTRY`, so no screen renders `anything`.
 */
export function DifficultyPicker({ value, onChange, className }: DifficultyPickerProps) {
  const family = STATUS_REGISTRY['difficulty-floor'];
  const options: DifficultyFloor[] = ['easy', 'medium', 'anything'];

  return (
    <div
      role="radiogroup"
      aria-label="How much effort are you up for?"
      className={cn('flex flex-col gap-2', className)}
    >
      <Repeat each={options}>
        {(option: DifficultyFloor) => {
          const on = value === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(option)}
              className={cn(
                'flex items-center gap-3 rounded-blade border px-4 py-3 text-left',
                'transition-colors duration-fast',
                'focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--sky-glow)]',
                on ? 'border-ink bg-sky-soft shadow-drop-sm' : 'border-line-2 bg-white hover:bg-paper-2',
              )}
            >
              <span
                className={cn(
                  'grid h-[22px] w-[22px] shrink-0 place-items-center rounded-round border-bold',
                  on ? 'border-ink bg-white' : 'border-line-2 bg-white',
                )}
              >
                {on && <span className="h-[11px] w-[11px] rounded-round bg-sky" />}
              </span>
              <span className="min-w-0">
                {/* Owned by the registry — never the raw enum. */}
                <span className="block text-ctrl font-extrabold text-ink">
                  {family[option].label}
                </span>
                <span className="block text-sm text-ink-2">{family[option].when}</span>
              </span>
            </button>
          );
        }}
      </Repeat>
    </div>
  );
}

/* ---------- Measurement ---------- */

export type MeasurementSystem = 'metric' | 'imperial' | 'as_we_measure';

export interface MeasurementToggleProps {
  readonly value: MeasurementSystem;
  readonly onChange: (value: MeasurementSystem) => void;
  readonly className?: string;
}

/**
 * How quantities are shown, everywhere.
 *
 * **Changing this re-renders EVERY quantity in the app** — it is a global
 * setting, not a per-screen one, and the copy says so.
 *
 * The third value is the PRD's: *as Nigerians measure* — derica, cup, wrap,
 * paint rubber. No generic recipe app offers it, and it is part of why this
 * product is for this audience.
 */
export function MeasurementToggle({ value, onChange, className }: MeasurementToggleProps) {
  const family = STATUS_REGISTRY.measurement;
  const options: MeasurementSystem[] = ['metric', 'imperial', 'as_we_measure'];

  return (
    <div className={className}>
      <div
        role="radiogroup"
        aria-label="How quantities are shown"
        className="inline-flex items-center gap-1 rounded-blade-sm border border-ink bg-paper-2 p-1"
      >
        <Repeat each={options}>
          {(option: MeasurementSystem) => {
            const on = value === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onChange(option)}
                className={cn(
                  'inline-flex h-ctrl-sm items-center rounded-blade-xs px-4 text-ctrl font-extrabold',
                  'transition-colors duration-fast',
                  'focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--sky-glow)]',
                  on ? 'bg-sky text-sky-onbase shadow-drop-sm' : 'text-ink-2 hover:bg-white hover:text-ink',
                )}
              >
                {family[option].label}
              </button>
            );
          }}
        </Repeat>
      </div>

      <p className="mt-2 flex items-start gap-2 text-sm text-ink-2">
        <KoboyoIcon name="info" size={14} className="mt-[3px] shrink-0 text-ink-3" />
        {family[value].when} This changes every quantity in the app, not just this screen.
      </p>
    </div>
  );
}
