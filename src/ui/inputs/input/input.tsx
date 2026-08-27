import type { InputHTMLAttributes, ReactNode } from 'react';

import { Loader2 } from '@icons';
import { cn } from '@shared/utils/cn';
import {
  FIELD_BASE_CLASS,
  FIELD_SIZE_CLASS,
  fieldStateClass,
  type FieldSize,
  type FieldTriad,
} from '../field-contract';

/**
 * The base field primitive. Everything else inherits this chrome.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/40-input-text.html
 *
 * Blade-cut, soft light border, sky focus glow — not the heavy black outline,
 * which reads as shouting when twelve of them sit on one screen.
 *
 * Carries the `disabled` / `readOnly` / `invalid` triad as three independent
 * booleans that combine. See `field-contract.ts` for why that matters.
 */

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'readOnly' | 'disabled'>,
    FieldTriad {
  readonly size?: FieldSize;
  /** A mark before the value — an icon or a unit. Never interactive. */
  readonly leading?: ReactNode;
  /** An action after the value — a clear button, a unit toggle. */
  readonly trailing?: ReactNode;
  /** Validating against the server. The field stays interactive. */
  readonly loading?: boolean;
}

/** Visual spec: design-system/projects/kinnijije-v2/preview/41-input-search.html */
export function Input({
  size = 'md',
  leading,
  trailing,
  loading = false,
  disabled,
  readOnly,
  invalid,
  error,
  className,
  ...rest
}: InputProps) {
  const hasLeading = leading !== undefined;
  const hasTrailing = trailing !== undefined || loading;

  const field = (
    <input
      disabled={disabled}
      readOnly={readOnly}
      aria-invalid={invalid === true ? true : undefined}
      aria-errormessage={error !== undefined ? `${rest.id ?? ''}-error` : undefined}
      className={cn(
        FIELD_BASE_CLASS,
        FIELD_SIZE_CLASS[size],
        fieldStateClass({ disabled, readOnly, invalid }),
        hasLeading && 'pl-11',
        hasTrailing && 'pr-11',
        className,
      )}
      {...rest}
    />
  );

  if (!hasLeading && !hasTrailing) return field;

  return (
    <div className="relative flex items-center">
      {hasLeading && (
        <span className="pointer-events-none absolute left-4 flex text-ink-3">{leading}</span>
      )}
      {field}
      {hasTrailing && (
        <span className="absolute right-4 flex text-ink-3">
          {loading ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            trailing
          )}
        </span>
      )}
    </div>
  );
}
