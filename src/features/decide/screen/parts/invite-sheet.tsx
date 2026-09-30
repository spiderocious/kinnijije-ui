import { useState, type FormEvent } from 'react';
import { Check, X } from 'lucide-react';

import { useRegister } from '@features/auth/hooks/use-auth-actions';
import { Button } from '@ui/primitives';

import { DECIDE_COPY } from '../../content/decide.content';
import { ILLUSTRATION } from '../../content/decide.illustrations';

/**
 * The signup invite, inside the flow.
 *
 * A bottom sheet rather than a centred modal: it sits where the thumb is, and
 * it visibly does not replace the screen underneath — the step behind stays
 * legible, which is what makes it read as an offer rather than a wall.
 *
 * Three rules, and it is only defensible because of them:
 *   1. never before value — the earliest it can appear is after step three
 *   2. never blocking — dismiss and the flow continues exactly where it was
 *   3. never twice — one dismissal ends it for the session
 *
 * The form is REAL, not a link. Navigating away to sign up and finding your
 * way back is the friction this exists to remove.
 */
interface InviteSheetProps {
  readonly onDismiss: () => void;
  /** Called once the account exists and the draft has been carried over. */
  readonly onSignedUp: () => void;
}

export function InviteSheet({ onDismiss, onSignedUp }: InviteSheetProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const register = useRegister({ onDone: onSignedUp });

  const canSubmit = email.trim().length > 0 && password.length >= 8;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    register.mutate({
      // Asked for later, in settings. Two fields is the most that can be
      // justified in the middle of somebody else's task.
      name: email.trim().split('@')[0] ?? 'there',
      email: email.trim(),
      password,
    });
  };

  return (
    <div
      className="fixed inset-0 z-modal flex items-end justify-center bg-scrim p-3"
      role="dialog"
      aria-modal="false"
      aria-label={DECIDE_COPY.invite.title}
      onClick={(e) => {
        // Only the scrim itself dismisses; a click inside the sheet must not.
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div className="flex w-full max-w-[460px] flex-col gap-3 rounded-blade-lg border-2 border-ink bg-white p-4 shadow-modal">
        <span aria-hidden="true" className="mx-auto h-1 w-9 rounded-pill bg-line-2" />

        <div className="flex items-start gap-2.5">
          <img
            src={ILLUSTRATION.heroDish}
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded-[11px_3px_11px_3px] border-2 border-ink bg-dish-fill object-cover"
          />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[17px] font-extrabold text-ink">
              {DECIDE_COPY.invite.title}
            </h2>
            <p className="mt-0.5 text-[12.5px] text-ink-2">{DECIDE_COPY.invite.sub}</p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label={DECIDE_COPY.invite.dismiss}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-round text-ink-4 hover:bg-paper-2 hover:text-ink"
          >
            <X size={15} strokeWidth={2.6} />
          </button>
        </div>

        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {DECIDE_COPY.invite.benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2 text-[12.5px] text-ink-2">
              <Check size={14} strokeWidth={3} className="mt-0.5 shrink-0 text-success" />
              {benefit}
            </li>
          ))}
        </ul>

        <form onSubmit={submit} noValidate className="flex flex-col gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); }}
            placeholder="you@example.com"
            aria-label="Email"
            autoComplete="email"
            className="min-h-ctrl w-full rounded-blade-xs border-2 border-line-2 bg-white px-3 text-base text-ink outline-none focus:border-sky"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); }}
            placeholder="A password, 8 characters or more"
            aria-label="Password"
            autoComplete="new-password"
            className="min-h-ctrl w-full rounded-blade-xs border-2 border-line-2 bg-white px-3 text-base text-ink outline-none focus:border-sky"
          />

          {register.error !== null && (
            <p className="text-[12px] font-bold text-critical-onsoft">
              {register.error.message}
            </p>
          )}

          <Button type="submit" fullWidth loading={register.isPending} disabled={!canSubmit}>
            {DECIDE_COPY.invite.cta}
          </Button>
        </form>

        <Button variant="tertiary" fullWidth onClick={onDismiss}>
          {DECIDE_COPY.invite.dismiss}
        </Button>

        <p className="m-0 text-center text-[10.5px] text-ink-4">{DECIDE_COPY.invite.footnote}</p>
      </div>
    </div>
  );
}
