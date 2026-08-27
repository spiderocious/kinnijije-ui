import type { Ref, TextareaHTMLAttributes } from 'react';

import { cn } from '@shared/utils/cn';
import { FIELD_BASE_CLASS, fieldStateClass, type FieldTriad } from '../field-contract';

/**
 * The multi-line field.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/42-textarea.html
 *
 * Same chrome and same triad as `Input` — it only differs in that it grows
 * vertically and resizes on the vertical axis only. Horizontal resize would
 * break the blade's proportions.
 */

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'readOnly' | 'disabled'>,
    FieldTriad {
  /** Character limit. Renders a live counter beneath the field. */
  readonly maxLength?: number;
  /** Current value length, for the counter. */
  readonly showCount?: boolean;
  /**
   * The underlying element. Needed by anything that manipulates the selection
   * — the markdown toolbar wraps what is selected, which requires the node.
   */
  readonly ref?: Ref<HTMLTextAreaElement>;
}

export function Textarea({
  ref,
  disabled,
  readOnly,
  invalid,
  error,
  maxLength,
  showCount = false,
  className,
  value,
  ...rest
}: TextareaProps) {
  const length = typeof value === 'string' ? value.length : 0;

  return (
    <div>
      <textarea
        ref={ref}
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        maxLength={maxLength}
        aria-invalid={invalid === true ? true : undefined}
        className={cn(
          FIELD_BASE_CLASS,
          'min-h-[108px] resize-y rounded-blade px-4 py-3 text-ctrl leading-relaxed',
          fieldStateClass({ disabled, readOnly, invalid }),
          className,
        )}
        {...rest}
      />
      {showCount && maxLength !== undefined && (
        <p
          className={cn(
            'mt-[6px] text-right font-mono text-xs tnum',
            length > maxLength * 0.9 ? 'text-caution-onsoft' : 'text-ink-3',
          )}
        >
          {length}/{maxLength}
        </p>
      )}
    </div>
  );
}
