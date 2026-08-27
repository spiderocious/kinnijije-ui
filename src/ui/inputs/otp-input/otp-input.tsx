import { useEffect, useRef } from 'react';
import { Repeat } from 'meemaw';

import { cn } from '@shared/utils/cn';
import type { FieldTriad } from '../field-contract';

/**
 * The one-time-code field.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/62-otp.html
 *
 * **This is a REAL input.** A visually-hidden field captures the keystrokes and
 * the cells are pure presentation — six separate `<input>`s look identical and
 * break paste, autofill, and every password manager.
 *
 * `inputMode="numeric"` so a phone shows the keypad rather than the alphabet.
 */

export interface OtpInputProps extends FieldTriad {
  readonly value: string;
  readonly onChange: (value: string) => void;
  /** Fires once the full code is entered. */
  readonly onComplete?: (value: string) => void;
  readonly length?: number;
  readonly label?: string;
  readonly autoFocus?: boolean;
  readonly className?: string;
}

export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  label = 'One-time code',
  autoFocus = false,
  disabled = false,
  invalid = false,
  className,
}: OtpInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const completed = useRef(false);

  useEffect(() => {
    if (value.length === length && !completed.current) {
      completed.current = true;
      onComplete?.(value);
    }
    if (value.length < length) completed.current = false;
  }, [value, length, onComplete]);

  const cells = Array.from({ length }, (_, index) => index);

  return (
    <div
      className={cn('relative inline-flex gap-2', disabled && 'opacity-[0.42]', className)}
      onClick={() => inputRef.current?.focus()}
    >
      {/* The real control. Everything visible below is presentation. */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label={label}
        aria-invalid={invalid ? true : undefined}
        maxLength={length}
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, length))}
        className="peer absolute inset-0 z-base w-full cursor-default opacity-0"
      />

      <Repeat each={cells}>
        {(index: number) => {
          const char = value[index];
          const active = value.length === index;
          return (
            <span
              key={index}
              aria-hidden="true"
              className={cn(
                'grid h-ctrl w-[46px] place-items-center rounded-blade-sm border-bold bg-white',
                'font-mono text-xl font-bold tnum text-ink',
                'transition-[border-color,box-shadow] duration-fast',
                invalid ? 'border-critical bg-critical-soft' : 'border-line-2',
                // The caret cell lights up only while the field has focus.
                active && 'peer-focus:border-sky peer-focus:shadow-[0_0_0_4px_var(--sky-glow)]',
                char !== undefined && !invalid && 'border-ink',
              )}
            >
              {char ?? ''}
            </span>
          );
        }}
      </Repeat>
    </div>
  );
}
