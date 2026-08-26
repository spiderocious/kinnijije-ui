import { createContext, useContext, useId, type ReactNode } from 'react';

import { cn } from '@shared/utils/cn';
import type { FieldTriad } from '../field-contract';

/**
 * The one-of-N choice.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/47-radio.html
 *                                                          48-radio-group.html
 *
 * Circular by exception to the blade — a blade on a 20px circle reads as
 * damage, and the round shape is what tells a user at a glance that this is
 * exclusive where a checkbox is not.
 *
 * Radios only exist inside a group. `RadioGroup` owns the name and the value so
 * two radios in one group cannot disagree about which is selected.
 */

interface RadioContextValue {
  name: string;
  value: string | undefined;
  onValueChange: (value: string) => void;
  disabled: boolean;
  readOnly: boolean;
  invalid: boolean;
}

const RadioContext = createContext<RadioContextValue | null>(null);

export interface RadioGroupProps extends FieldTriad {
  readonly value: string | undefined;
  readonly onValueChange: (value: string) => void;
  readonly label: string;
  readonly orientation?: 'vertical' | 'horizontal';
  readonly className?: string;
  readonly children: ReactNode;
}

export function RadioGroup({
  value,
  onValueChange,
  label,
  orientation = 'vertical',
  disabled = false,
  readOnly = false,
  invalid = false,
  className,
  children,
}: RadioGroupProps) {
  const name = useId();

  return (
    <RadioContext.Provider
      value={{ name, value, onValueChange, disabled, readOnly, invalid }}
    >
      <div
        role="radiogroup"
        aria-label={label}
        aria-invalid={invalid ? true : undefined}
        className={cn(
          'flex gap-3',
          orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap items-center',
          disabled && 'opacity-[0.42] pointer-events-none',
          className,
        )}
      >
        {children}
      </div>
    </RadioContext.Provider>
  );
}

export interface RadioProps {
  readonly value: string;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

export function Radio({ value, disabled = false, className, children }: RadioProps) {
  const context = useContext(RadioContext);
  if (context === null) {
    throw new Error('<Radio> must be rendered inside <RadioGroup>.');
  }

  const selected = context.value === value;
  const isDisabled = disabled || context.disabled;

  return (
    <label
      className={cn(
        'inline-flex cursor-pointer items-center gap-3 text-ctrl',
        (isDisabled || context.readOnly) && 'cursor-default',
        disabled && 'opacity-[0.42]',
        className,
      )}
    >
      <span className="relative inline-flex shrink-0">
        <input
          type="radio"
          name={context.name}
          value={value}
          checked={selected}
          disabled={isDisabled}
          onChange={() => {
            if (context.readOnly) return;
            context.onValueChange(value);
          }}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={cn(
            'grid h-[22px] w-[22px] place-items-center rounded-round border-bold transition-all duration-fast ease-kj',
            'peer-focus-visible:shadow-[0_0_0_4px_var(--sky-glow)]',
            selected ? 'border-ink bg-white' : 'border-line-2 bg-white',
            context.invalid && !selected && 'border-critical bg-critical-soft',
            context.readOnly && 'border-dashed',
          )}
        >
          {selected && <span className="h-[11px] w-[11px] rounded-round bg-sky animate-pop" />}
        </span>
      </span>
      <span className="font-semibold">{children}</span>
    </label>
  );
}
