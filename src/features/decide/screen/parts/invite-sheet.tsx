import { useState, type FormEvent } from 'react';
import { ArrowLeft, Check, LogIn, UserPlus, X } from 'lucide-react';

import { useLogin, useRegister } from '@features/auth/hooks/use-auth-actions';
import { fieldError } from '@features/auth/hooks/use-field-errors';
import { Field, Input, PasswordInput } from '@ui/inputs';
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
 * The forms are REAL, not links. Navigating away to sign up and finding your
 * way back is the friction this exists to remove — which is also why signing
 * in here does not navigate either.
 */

/**
 * Which face the sheet is showing.
 *
 * `choice` first, deliberately. Asking "who are you" before showing a form is
 * one extra tap, and it buys two things worth more than the tap: a returning
 * cook is never shown a signup form that will reject their email, and a new
 * one is never shown a password field before they have decided to commit.
 */
type Mode = 'choice' | 'signup' | 'login';

interface InviteSheetProps {
  readonly onDismiss: () => void;
  /** Called once the account exists and the draft has been carried over. */
  readonly onSignedUp: () => void;
}

export function InviteSheet({ onDismiss, onSignedUp }: InviteSheetProps) {
  const [mode, setMode] = useState<Mode>('choice');

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
      <div className="flex max-h-[88dvh] w-full max-w-[460px] flex-col gap-3 overflow-y-auto rounded-blade-lg border-2 border-ink bg-white p-4 shadow-modal">
        <span aria-hidden="true" className="mx-auto h-1 w-9 shrink-0 rounded-pill bg-line-2" />

        <SheetHeader mode={mode} onBack={() => { setMode('choice'); }} onDismiss={onDismiss} />

        {mode === 'choice' && (
          <ChoiceFace
            onSignUp={() => { setMode('signup'); }}
            onLogIn={() => { setMode('login'); }}
            onDismiss={onDismiss}
          />
        )}

        {mode === 'signup' && <SignUpFace onDone={onSignedUp} />}
        {mode === 'login' && <LogInFace onDone={onSignedUp} />}
      </div>
    </div>
  );
}

/**
 * The header, which changes with the face.
 *
 * On a form it carries a back arrow rather than only a close button: picking
 * the wrong path must cost one tap to undo, not a dismissal that cannot be
 * reopened this session.
 */
function SheetHeader({
  mode,
  onBack,
  onDismiss,
}: {
  readonly mode: Mode;
  readonly onBack: () => void;
  readonly onDismiss: () => void;
}) {
  const { invite } = DECIDE_COPY;
  const heading =
    mode === 'signup' ? invite.forms.signUp.title
    : mode === 'login' ? invite.forms.logIn.title
    : invite.title;
  const sub =
    mode === 'signup' ? invite.forms.signUp.sub
    : mode === 'login' ? invite.forms.logIn.sub
    : invite.sub;

  return (
    <div className="flex shrink-0 items-start gap-2.5">
      {mode === 'choice' ? (
        <img
          src={ILLUSTRATION.heroDish}
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 shrink-0 rounded-[11px_3px_11px_3px] border-2 border-ink bg-dish-fill object-cover"
        />
      ) : (
        <button
          type="button"
          onClick={onBack}
          aria-label={invite.forms.back}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-blade-xs border-2 border-line-2 text-ink-2 hover:border-ink hover:text-ink"
        >
          <ArrowLeft size={16} strokeWidth={2.6} />
        </button>
      )}

      <div className="min-w-0 flex-1">
        <h2 className="font-display text-[17px] font-extrabold text-ink">{heading}</h2>
        <p className="mt-0.5 text-[12.5px] text-ink-2">{sub}</p>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label={invite.dismiss}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-round text-ink-4 hover:bg-paper-2 hover:text-ink"
      >
        <X size={15} strokeWidth={2.6} />
      </button>
    </div>
  );
}

/**
 * The three-way choice.
 *
 * The hierarchy is the point. Sign up carries the drop shadow and the sky
 * fill, so it is unmistakably the one thing being asked for. Sign in is
 * outlined — available without competing. Skip is plain text, because an
 * escape route that looks like a button is an escape route people take by
 * mistake.
 */
function ChoiceFace({
  onSignUp,
  onLogIn,
  onDismiss,
}: {
  readonly onSignUp: () => void;
  readonly onLogIn: () => void;
  readonly onDismiss: () => void;
}) {
  const { invite } = DECIDE_COPY;

  return (
    <>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {invite.benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2 text-[12.5px] text-ink-2">
            <Check size={14} strokeWidth={3} className="mt-0.5 shrink-0 text-success" />
            {benefit}
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2">
        <Button fullWidth size="lg" onClick={onSignUp}>
          <UserPlus size={17} strokeWidth={2.6} className="mr-2" />
          {invite.choice.signUp}
        </Button>

        <Button fullWidth variant="secondary" onClick={onLogIn}>
          <LogIn size={16} strokeWidth={2.6} className="mr-2" />
          {invite.choice.logIn}
        </Button>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="mx-auto rounded-blade-xs px-3 py-1.5 text-[12.5px] font-extrabold text-ink-3 underline-offset-2 hover:text-ink hover:underline"
      >
        {invite.choice.skip}
      </button>

      <p className="m-0 text-center text-[10.5px] text-ink-4">{invite.footnote}</p>
    </>
  );
}

/** Name, email, password. The name is ASKED FOR, never derived from an email. */
function SignUpFace({ onDone }: { readonly onDone: () => void }) {
  const copy = DECIDE_COPY.invite.forms.signUp;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const register = useRegister({ onDone });
  const error = register.error;

  const canSubmit =
    name.trim().length > 0 && email.trim().length > 0 && password.length >= 8;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    register.mutate({ name: name.trim(), email: email.trim(), password });
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <FormError message={error?.message} />

      <Field label={copy.name} error={fieldError(error, 'name')}>
        {({ id, describedBy }) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            autoComplete="name"
            placeholder={copy.namePlaceholder}
            value={name}
            onChange={(event) => { setName(event.target.value); }}
            invalid={fieldError(error, 'name') !== undefined}
          />
        )}
      </Field>

      <Field label={copy.email} error={fieldError(error, 'email')}>
        {({ id, describedBy }) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={copy.emailPlaceholder}
            value={email}
            onChange={(event) => { setEmail(event.target.value); }}
            invalid={fieldError(error, 'email') !== undefined}
          />
        )}
      </Field>

      <PasswordInput
        label={copy.password}
        // The meter replaces a static "8 characters or more" hint: it says the
        // same thing and keeps saying it as they type.
        showStrength
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        {...(fieldError(error, 'password') !== undefined && {
          invalid: true,
          error: fieldError(error, 'password'),
        })}
      />

      <Button type="submit" fullWidth size="lg" loading={register.isPending} disabled={!canSubmit}>
        {copy.submit}
      </Button>
    </form>
  );
}

/** Email and password. No carry-over — see `useLogin`. */
function LogInFace({ onDone }: { readonly onDone: () => void }) {
  const copy = DECIDE_COPY.invite.forms.logIn;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin({ onDone });
  const error = login.error;

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    login.mutate({ email: email.trim(), password });
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <FormError message={error?.message} />

      <Field label={copy.email} error={fieldError(error, 'email')}>
        {({ id, describedBy }) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={copy.emailPlaceholder}
            value={email}
            onChange={(event) => { setEmail(event.target.value); }}
            invalid={fieldError(error, 'email') !== undefined}
          />
        )}
      </Field>

      <PasswordInput
        label={copy.password}
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        {...(fieldError(error, 'password') !== undefined && {
          invalid: true,
          error: fieldError(error, 'password'),
        })}
      />

      <Button type="submit" fullWidth size="lg" loading={login.isPending} disabled={!canSubmit}>
        {copy.submit}
      </Button>
    </form>
  );
}

function FormError({ message }: { readonly message: string | undefined }) {
  if (message === undefined) return null;
  return (
    <p className="m-0 rounded-blade-xs border-hair border-critical-border bg-critical-soft px-3 py-2 text-[12px] font-bold text-critical-onsoft">
      {message}
    </p>
  );
}
