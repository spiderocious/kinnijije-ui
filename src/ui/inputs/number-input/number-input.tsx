import { useEffect, useState, type InputHTMLAttributes } from 'react';

import { cn } from '@shared/utils/cn';
import {
  FIELD_BASE_CLASS,
  FIELD_SIZE_CLASS,
  fieldStateClass,
  type FieldSize,
  type FieldTriad,
} from '../field-contract';

/**
 * The numeric field — distinct from `Stepper`, which is for nudging.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/44-input-number.html
 *
 * **Clamps on BLUR, not on keystroke.** Clamping as you type makes "10" become
 * "1" the instant a max of 9 is set, which is unusable — a person typing 100
 * passes through 1 and 10 on the way.
 *
 * The value renders through `Figure` when read-only, so 45 / 45.0 / 45m cannot
 * diverge between this and the rest of the system.
 */

export interface NumberInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'readOnly' | 'disabled' | 'value' | 'onChange' | 'type'>,
    FieldTriad {
  readonly value: number | null;
  readonly onChange: (value: number | null) => void;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  /** A unit rendered inside the trailing edge — "min", "g". */
  readonly unit?: string;
  readonly size?: FieldSize;
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  size = 'md',
  disabled,
  readOnly,
  invalid,
  className,
  ...rest
}: NumberInputProps) {
  // The draft is what the user is typing; `value` is what has been committed.
  const [draft, setDraft] = useState(value === null ? '' : String(value));

  useEffect(() => {
    setDraft(value === null ? '' : String(value));
  }, [value]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed === '') {
      onChange(null);
      return;
    }
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) {
      setDraft(value === null ? '' : String(value));
      return;
    }
    // Clamping happens HERE, on blur — never mid-keystroke.
    let next = parsed;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    onChange(next);
    setDraft(String(next));
  }

  return (
    <div className="relative flex items-center">
      <input
        type="text"
        inputMode="decimal"
        value={draft}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={invalid === true ? true : undefined}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit();
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            onChange((value ?? 0) + step);
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            onChange((value ?? 0) - step);
          }
        }}
        className={cn(
          FIELD_BASE_CLASS,
          FIELD_SIZE_CLASS[size],
          fieldStateClass({ disabled, readOnly, invalid }),
          'font-mono tnum',
          unit !== undefined && 'pr-12',
          className,
        )}
        {...rest}
      />
      {unit !== undefined && (
        <span className="pointer-events-none absolute right-4 text-sm font-semibold text-ink-3">
          {unit}
        </span>
      )}
    </div>
  );
}
