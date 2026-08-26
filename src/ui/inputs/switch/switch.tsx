import { cn } from '@shared/utils/cn';

/**
 * The instant toggle, and the rule for when it is the wrong control.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/49-switch.html
 *
 * **A switch commits immediately.** It is only correct where the change is
 * instant and reversible — a measurement preference, a feature flag. Anything
 * needing a Save button is a checkbox.
 *
 * There is deliberately no `loading` prop: a switch **stays interactive while
 * committing** and reverts on failure. Disabling it mid-commit strands the user
 * in a state they cannot leave.
 *
 * `lockReason` renders beside it — a silent locked switch is a bug report.
 */

export interface SwitchProps {
  readonly checked: boolean;
  readonly onCheckedChange: (checked: boolean) => void;
  readonly label: string;
  /** Hides the visible label but keeps it for screen readers. */
  readonly hideLabel?: boolean;
  readonly disabled?: boolean;
  /** Policy gate. Renders beside the switch — never silent. */
  readonly lockReason?: string;
  /** The commit failed. It snapped back and says so. */
  readonly error?: string;
  readonly className?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  hideLabel = false,
  disabled = false,
  lockReason,
  error,
  className,
}: SwitchProps) {
  const locked = lockReason !== undefined;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label
        className={cn(
          'inline-flex cursor-pointer items-center gap-3',
          (disabled || locked) && 'cursor-not-allowed opacity-[0.42]',
        )}
      >
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={hideLabel ? label : undefined}
          disabled={disabled || locked}
          onClick={() => onCheckedChange(!checked)}
          className={cn(
            'relative inline-flex h-[28px] w-[50px] shrink-0 items-center',
            // A pill — one of the blade's two exceptions.
            'rounded-pill border-bold border-ink transition-colors duration-[160ms] ease-kj',
            'focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--sky-glow)]',
            'disabled:cursor-not-allowed',
            checked ? 'bg-sky' : 'bg-paper-3',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'absolute left-[2px] h-5 w-5 rounded-round border-hair border-ink bg-white',
              'transition-transform duration-[160ms] ease-kj',
              checked && 'translate-x-[22px]',
            )}
          />
        </button>

        {!hideLabel && <span className="text-ctrl font-semibold text-ink">{label}</span>}
      </label>

      {locked && <p className="text-xs font-extrabold text-ink-3">{lockReason}</p>}
      {error !== undefined && (
        <p role="alert" className="text-xs font-extrabold text-critical-onsoft">
          {error}
        </p>
      )}
    </div>
  );
}
