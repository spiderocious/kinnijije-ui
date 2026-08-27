import { useState } from 'react';
import { Repeat, Show } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { cn } from '@shared/utils/cn';
import { Button } from '@ui/primitives';
import { Textarea } from '@ui/inputs';

/**
 * Flag a step or an ingredient.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/264-flag-step.html
 *
 * **The seed's slow correction mechanism**, which the PRD calls essential: a
 * tested recipe stays tested because cooks tell us when it is wrong.
 *
 * **Deliberately low-friction and non-judgemental.** A cook offering a
 * correction is doing the product a favour — the copy thanks them rather than
 * asking them to justify themselves, and the reason field is optional because
 * "this took longer" is already useful without a paragraph.
 */

export type FlagReason =
  | 'time-wrong'
  | 'quantity-wrong'
  | 'step-unclear'
  | 'ingredient-wrong'
  | 'other';

const REASON_LABEL: Record<FlagReason, string> = {
  'time-wrong': 'The time was off',
  'quantity-wrong': 'A quantity was off',
  'step-unclear': 'The step was unclear',
  'ingredient-wrong': 'An ingredient looks wrong',
  other: 'Something else',
};

export interface FlagStepProps {
  /** What is being flagged, in the cook's words — "Step 3". */
  readonly target: string;
  readonly onSubmit: (flag: { reason: FlagReason; note: string }) => void;
  readonly onCancel?: () => void;
  /** Sending. The form stays readable and the note is not cleared. */
  readonly sending?: boolean;
  /**
   * The send failed.
   *
   * **The note is KEPT.** Someone who just typed a paragraph about a broken
   * recipe will not type it twice, and losing it on a network blip is how a
   * product stops hearing from the people most willing to help it.
   */
  readonly error?: string;
  /** Already flagged by this user — one report per person per step. */
  readonly alreadyFlagged?: boolean;
  readonly className?: string;
}

/** The flag sheet. Two taps to send, and the note is optional. */
export function FlagStep({
  target,
  onSubmit,
  onCancel,
  sending = false,
  error,
  alreadyFlagged = false,
  className,
}: FlagStepProps) {
  const [reason, setReason] = useState<FlagReason | null>(null);
  const [note, setNote] = useState('');

  const reasons: FlagReason[] = [
    'time-wrong',
    'quantity-wrong',
    'step-unclear',
    'ingredient-wrong',
    'other',
  ];

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div>
        <h2 className="font-display text-lg font-extrabold tracking-display">
          What was wrong with {target}?
        </h2>
        {/* Thanks, not an interrogation. */}
        <p className="mt-1 text-sm text-ink-2">
          A person reads every one of these, and the recipe gets fixed. Thank you.
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        <Repeat each={reasons}>
          {(option: FlagReason) => {
            const picked = reason === option;
            return (
              <li key={option}>
                <button
                  type="button"
                  aria-pressed={picked}
                  onClick={() => setReason(option)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-blade border px-4 py-3 text-left',
                    'transition-colors duration-fast',
                    'focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]',
                    picked
                      ? 'border-ink bg-sky-soft shadow-drop-sm'
                      : 'border-line-2 bg-white hover:bg-paper-2',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-[20px] w-[20px] shrink-0 place-items-center rounded-round border-bold',
                      picked ? 'border-ink bg-white' : 'border-line-2 bg-white',
                    )}
                  >
                    {picked && <span className="h-[10px] w-[10px] rounded-round bg-sky" />}
                  </span>
                  <span className="text-ctrl font-semibold text-ink">
                    {REASON_LABEL[option]}
                  </span>
                </button>
              </li>
            );
          }}
        </Repeat>
      </ul>

      {/* Optional — "this took longer" is already useful without a paragraph. */}
      <div>
        <label className="mb-2 block text-sm font-extrabold text-ink-2">
          Anything else? <span className="font-semibold text-ink-4">Optional</span>
        </label>
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="It says 12 minutes but mine took nearly 25."
          aria-label="Anything else"
        />
      </div>

      {/* The failure sits directly above the control that retries it, and the
          note above is untouched — retry sends exactly what was typed. */}
      <Show when={error !== undefined}>
        <p role="alert" className="text-sm font-semibold text-critical">
          {error}
        </p>
      </Show>

      <div className="flex flex-wrap gap-3">
        <Button
          disabled={reason === null || alreadyFlagged}
          loading={sending}
          onClick={() => {
            if (reason !== null) onSubmit({ reason, note });
          }}
        >
          {error !== undefined ? 'Try again' : 'Send it'}
        </Button>
        <Show when={onCancel !== undefined}>
          <Button variant="secondary" onClick={onCancel}>
            Not now
          </Button>
        </Show>
      </div>

      <Show when={alreadyFlagged}>
        <p className="text-sm text-ink-3">
          You have already reported this step. Thank you — it is in the queue.
        </p>
      </Show>
    </div>
  );
}

export interface FlagStepTriggerProps {
  readonly onFlag: () => void;
  readonly className?: string;
}

/**
 * The quiet way in, sitting beside a step.
 *
 * Deliberately understated — a prominent "report this" button on every step
 * suggests the recipes are unreliable, which is the opposite of the claim.
 */
export function FlagStepTrigger({ onFlag, className }: FlagStepTriggerProps) {
  return (
    <button
      type="button"
      onClick={onFlag}
      className={cn(
        'inline-flex items-center gap-1 rounded-[3px] text-xs font-extrabold text-ink-4',
        'transition-colors hover:text-ink-2 focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]',
        className,
      )}
    >
      <KoboyoIcon name="reportFlag" size={12} />
      Something wrong?
    </button>
  );
}

export interface FlagSubmittedProps {
  readonly className?: string;
}

/** What a cook sees after sending. Rung 3 of the celebration ladder. */
export function FlagSubmitted({ className }: FlagSubmittedProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-blade border border-success-border bg-success-soft px-4 py-3',
        className,
      )}
    >
      <KoboyoIcon name="tick" size={18} className="shrink-0 text-success-onsoft" />
      <p className="text-sm text-success-onsoft">
        <b className="font-extrabold">Sent.</b> A person will check it, and the recipe gets fixed
        for everyone.
      </p>
    </div>
  );
}
