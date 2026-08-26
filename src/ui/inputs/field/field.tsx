import { useId, type ReactNode } from 'react';

import { KoboyoIcon, Loader2 } from '@icons';
import { cn } from '@shared/utils/cn';

/**
 * The wrapper every input sits in.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/66-form-field.html
 *
 * It owns WHEN validation runs — on submit, on blur, or debounced on change —
 * so twelve fields on one screen cannot each pick their own moment. `mode` is
 * set once on the form, not per field.
 *
 * **Server errors inject into the same slot as client errors.** One error
 * surface per field, so a user never has to look in two places to find out what
 * is wrong.
 */

/** Set ONCE on the form, never per field. */
export type ValidationMode = 'onSubmit' | 'onBlur' | 'onChange';

export interface FieldProps {
  readonly label: string;
  /** Helper text beneath the label. Hidden once an error takes the slot. */
  readonly hint?: string;
  /** Client or server error — one surface for both. */
  readonly error?: string;
  /** Marks the label. An unmarked field is required by default. */
  readonly optional?: boolean;
  readonly disabled?: boolean;
  /** Async validation in flight. */
  readonly loading?: boolean;
  readonly className?: string;
  /** Receives the generated id so label and control stay wired. */
  readonly children: (props: { id: string; describedBy: string | undefined }) => ReactNode;
}

export function Field({
  label,
  hint,
  error,
  optional = false,
  disabled = false,
  loading = false,
  className,
  children,
}: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const hasError = error !== undefined && error !== '';
  // The error takes the hint's slot rather than stacking beneath it — two
  // messages under one field is how a user stops reading either.
  const describedBy = hasError ? errorId : hint !== undefined ? hintId : undefined;

  return (
    <div className={cn('block', disabled && 'opacity-[0.42] pointer-events-none', className)}>
      <label
        htmlFor={id}
        className="mb-[6px] flex items-center gap-2 text-sm font-extrabold text-ink-2"
      >
        {label}
        {optional && <span className="font-semibold text-ink-4">Optional</span>}
        {loading && <Loader2 size={12} className="animate-spin text-ink-3" aria-hidden="true" />}
      </label>

      {children({ id, describedBy })}

      {hasError ? (
        <p
          id={errorId}
          role="alert"
          className="mt-[6px] flex items-center gap-[5px] text-xs font-extrabold text-critical-onsoft"
        >
          <KoboyoIcon name="error" size={13} />
          {error}
        </p>
      ) : (
        hint !== undefined && (
          <p id={hintId} className="mt-[6px] text-xs text-ink-3">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
