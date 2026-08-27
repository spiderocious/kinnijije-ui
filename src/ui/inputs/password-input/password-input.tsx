import { useMemo, useState } from 'react';
import { Repeat, Show } from 'meemaw';

import { Eye, EyeOff } from '@icons';
import { cn } from '@shared/utils/cn';
import {
  FIELD_BASE_CLASS,
  FIELD_SIZE_CLASS,
  fieldStateClass,
  type FieldSize,
  type FieldTriad,
} from '../field-contract';

/**
 * Password field and its meter.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/63-password.html
 *                                                          64-strength-bar.html
 *
 * **The meter and the validator share ONE function** — `scorePassword`. They
 * cannot disagree, which is the failure mode where a bar says "strong" and the
 * server says "too weak".
 *
 * **Empty shows NO meter.** A zero-strength bar reads as a failure the user has
 * not earned yet — they have not typed anything.
 */

export type StrengthScore = 0 | 1 | 2 | 3 | 4;

const SCORE_LABEL: Record<StrengthScore, string> = {
  0: 'Too short',
  1: 'Weak',
  2: 'Getting there',
  3: 'Good',
  4: 'Strong',
};

const SCORE_CLASS: Record<StrengthScore, string> = {
  0: 'bg-line-2',
  1: 'bg-critical',
  2: 'bg-caution',
  3: 'bg-info',
  4: 'bg-success',
};

/**
 * The single source of truth for strength. The meter renders it and a form
 * validates against it — one function, so they cannot diverge.
 */
export function scorePassword(password: string): StrengthScore {
  if (password.length < 8) return 0;
  let score = 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(4, score) as StrengthScore;
}

export interface StrengthBarProps {
  readonly score: StrengthScore;
  readonly labels?: Record<StrengthScore, string>;
  readonly className?: string;
}

/** Four segments. **Score 0 renders EMPTY segments, never a red bar.** */
export function StrengthBar({ score, labels = SCORE_LABEL, className }: StrengthBarProps) {
  const segments = [1, 2, 3, 4];

  return (
    <div className={className}>
      <div className="flex gap-[3px]">
        <Repeat each={segments}>
          {(segment: number) => (
            <span
              key={segment}
              className={cn(
                'h-[5px] flex-1 rounded-pill transition-colors duration-fast',
                // Score 0 leaves every segment empty — it is not a failure yet.
                score > 0 && segment <= score ? SCORE_CLASS[score] : 'bg-paper-3',
              )}
            />
          )}
        </Repeat>
      </div>
      <p className="mt-1 text-xs font-extrabold text-ink-3">{labels[score]}</p>
    </div>
  );
}

export interface PasswordInputProps extends FieldTriad {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly label: string;
  readonly size?: FieldSize;
  /** Renders the meter beneath — only once something has been typed. */
  readonly showStrength?: boolean;
  readonly autoComplete?: string;
  readonly id?: string;
  readonly className?: string;
}

export function PasswordInput({
  value,
  onChange,
  placeholder,
  label,
  size = 'md',
  showStrength = false,
  autoComplete = 'current-password',
  id,
  disabled,
  readOnly,
  invalid,
  className,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const score = useMemo(() => scorePassword(value), [value]);

  return (
    <div className={className}>
      <div className="relative flex items-center">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-label={label}
          aria-invalid={invalid === true ? true : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            FIELD_BASE_CLASS,
            FIELD_SIZE_CLASS[size],
            fieldStateClass({ disabled, readOnly, invalid }),
            'pr-11',
          )}
        />
        <button
          type="button"
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          className="absolute right-3 grid h-7 w-7 place-items-center rounded-round text-ink-3 transition-colors hover:bg-paper-2 hover:text-ink focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* Nothing typed, nothing judged. */}
      <Show when={showStrength && value.length > 0}>
        <StrengthBar score={score} className="mt-2" />
      </Show>
    </div>
  );
}
