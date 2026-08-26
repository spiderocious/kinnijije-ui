import { useEffect, useRef, type ReactNode } from 'react';

import { Check, Minus } from '@icons';
import { cn } from '@shared/utils/cn';
import type { FieldTriad } from '../field-contract';

/**
 * The checkbox, with the indeterminate state a bulk-select header needs.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/45-checkbox.html
 *
 * Blade-cut at the smallest size the law allows.
 *
 * **`'mixed'` is a real value, not a visual hack for a parent row.** A parent
 * over a partly-selected group is genuinely not the same as unchecked, and
 * modelling it as a third value is what stops the header lying about its group.
 */

export type CheckedState = boolean | 'mixed';

export interface CheckboxProps extends FieldTriad {
  readonly checked: CheckedState;
  readonly onCheckedChange: (checked: boolean) => void;
  readonly name?: string;
  readonly value?: string;
  readonly className?: string;
  readonly children?: ReactNode;
}

export function Checkbox({
  checked,
  onCheckedChange,
  disabled = false,
  readOnly = false,
  invalid = false,
  name,
  value,
  className,
  children,
}: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  // `indeterminate` is a DOM property, not an attribute — React cannot set it
  // declaratively, so it has to be written after every render.
  useEffect(() => {
    if (ref.current !== null) ref.current.indeterminate = checked === 'mixed';
  }, [checked]);

  const isOn = checked === true || checked === 'mixed';

  return (
    <label
      className={cn(
        'inline-flex cursor-pointer items-center gap-3 text-ctrl',
        (disabled || readOnly) && 'cursor-default',
        disabled && 'opacity-[0.42]',
        className,
      )}
    >
      <span className="relative inline-flex shrink-0">
        <input
          ref={ref}
          type="checkbox"
          name={name}
          value={value}
          checked={checked === true}
          disabled={disabled}
          aria-invalid={invalid ? true : undefined}
          aria-checked={checked === 'mixed' ? 'mixed' : checked}
          onChange={(event) => {
            if (readOnly) return;
            onCheckedChange(event.target.checked);
          }}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={cn(
            'grid h-[22px] w-[22px] place-items-center rounded-blade-xs border-bold transition-all duration-fast ease-kj',
            'peer-focus-visible:shadow-[0_0_0_4px_var(--sky-glow)]',
            isOn ? 'border-ink bg-sky text-sky-onbase' : 'border-line-2 bg-white',
            invalid && !isOn && 'border-critical bg-critical-soft',
            readOnly && 'border-dashed',
          )}
        >
          {checked === 'mixed' ? (
            <Minus size={14} strokeWidth={3.5} className="animate-pop" />
          ) : checked ? (
            <Check size={14} strokeWidth={3.5} className="animate-pop" />
          ) : null}
        </span>
      </span>
      {children !== undefined && <span className="font-semibold">{children}</span>}
    </label>
  );
}
