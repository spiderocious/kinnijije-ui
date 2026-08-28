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

/** Visual spec: design-system/projects/kinnijije-v2/preview/160-inline-error.html */
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

/**
 * A field loading its value into a known shape.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/40-input-text.html
 *
 * **This is not the same as `loading`.** `loading` means the field is real,
 * populated, and validating against the server; the skeleton means the value
 * has not arrived yet. Rendering an empty enabled input while a value is in
 * flight is how a user starts typing into a box that is about to be overwritten.
 *
 * The height reads `--h-md`, so this is 46px in the KITCHEN and 34px under
 * `.counter` without taking a density prop — the same rule as every control.
 *
 * Every input in the library shares this rather than shipping twenty variants
 * of the same grey box, and the label rail is preserved so nothing shifts when
 * the real field replaces it.
 */
export interface FieldSkeletonProps {
  /** Reserves the hint row, so a hinted field does not jump when it loads. */
  readonly withHint?: boolean;
  /** For a textarea and other tall controls. Defaults to one control height. */
  readonly rows?: number;
  readonly className?: string;
}

export function FieldSkeleton({ withHint = false, rows = 1, className }: FieldSkeletonProps) {
  return (
    <div aria-hidden="true" className={cn('block', className)}>
      <span className="mb-1.5 block h-[13px] w-24 animate-shimmer rounded-[3px] bg-skeleton" />
      <span
        className={cn(
          'block w-full animate-shimmer rounded-blade-sm bg-skeleton',
          rows === 1 && 'h-ctrl',
        )}
        style={rows > 1 ? { height: `calc(var(--h-md) * ${rows})` } : undefined}
      />
      {withHint && (
        <span className="mt-1.5 block h-[12px] w-40 animate-shimmer rounded-[3px] bg-skeleton" />
      )}
    </div>
  );
}
