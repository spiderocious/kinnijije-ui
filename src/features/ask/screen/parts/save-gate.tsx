import { useState, type FormEvent } from 'react';
import { ArrowLeft, Bookmark, Check, X } from 'lucide-react';

import { useLogin, useRegister } from '@features/auth/hooks/use-auth-actions';
import { fieldError } from '@features/auth/hooks/use-field-errors';
import { Field, Input, PasswordInput } from '@ui/inputs';
import { Button } from '@ui/primitives';

import { ASK_COPY } from '../../content/ask.content';

/**
 * "Save this" when there is no account yet.
 *
 * A redirect to /register was the wrong answer: it throws away the thread, the
 * verdict and the thing they were trying to keep, and asks somebody mid-task to
 * start a different task. Signing up IN PLACE costs them one form and nothing
 * else, and the save completes on its own afterwards.
 *
 * It names the meal, because "create an account" is a chore and "keep Jollof
 * Rice" is a reason.
 */
type Mode = 'pitch' | 'signup' | 'login';

interface SaveGateProps {
  /** The dish they tried to keep. Named, so the ask is concrete. */
  readonly mealName: string;
  readonly onClose: () => void;
  /** Fired once an account exists. The caller completes the save. */
  readonly onAuthed: () => void;
}

export function SaveGate({ mealName, onClose, onAuthed }: SaveGateProps) {
  const [mode, setMode] = useState<Mode>('pitch');
  const copy = ASK_COPY.saveGate;

  return (
    <div
      className="fixed inset-0 z-modal flex items-end justify-center bg-scrim p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="kj-bubble-in flex max-h-[88dvh] w-full max-w-[400px] flex-col gap-3 overflow-y-auto rounded-blade-lg border-2 border-ink bg-white p-5 shadow-modal">
        <div className="flex items-start gap-3">
          {mode === 'pitch' ? (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-blade-xs border-2 border-ink bg-sky text-white">
              <Bookmark size={18} strokeWidth={2.6} />
            </span>
          ) : (
            <button
              type="button"
              onClick={() => { setMode('pitch'); }}
              aria-label={copy.back}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-blade-xs border-2 border-line-2 text-ink-2 hover:border-ink hover:text-ink"
            >
              <ArrowLeft size={17} strokeWidth={2.6} />
            </button>
          )}

          <div className="min-w-0 flex-1">
            <h2 className="m-0 font-display text-[18px] font-extrabold leading-tight text-ink">
              {mode === 'signup' ? copy.signupTitle
                : mode === 'login' ? copy.loginTitle
                : copy.title}
            </h2>
            <p className="m-0 mt-0.5 text-[13px] leading-snug text-ink-2">
              {mode === 'pitch' ? copy.body(mealName) : copy.sub}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-round text-ink-4 hover:bg-paper-2 hover:text-ink"
          >
            <X size={15} strokeWidth={2.6} />
          </button>
        </div>

        {mode === 'pitch' && (
          <>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {copy.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 text-[13px] text-ink-2">
                  <Check size={14} strokeWidth={3} className="mt-0.5 shrink-0 text-success" />
                  {benefit}
                </li>
              ))}
            </ul>

            <div className="mt-1 flex flex-col gap-2">
              <Button fullWidth size="lg" onClick={() => { setMode('signup'); }}>
                {copy.create}
              </Button>
              <Button fullWidth variant="secondary" onClick={() => { setMode('login'); }}>
                {copy.haveOne}
              </Button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mx-auto rounded-blade-xs px-3 py-1 text-[12.5px] font-extrabold text-ink-3 underline-offset-2 hover:text-ink hover:underline"
            >
              {copy.notNow}
            </button>

            <p className="m-0 text-center text-[10.5px] text-ink-4">{copy.footnote}</p>
          </>
        )}

        {mode === 'signup' && <SignUpForm onDone={onAuthed} />}
        {mode === 'login' && <LogInForm onDone={onAuthed} />}
      </div>
    </div>
  );
}

/** Name, email, password. Never derived from the email — that guesses wrong. */
function SignUpForm({ onDone }: { readonly onDone: () => void }) {
  const copy = ASK_COPY.saveGate.form;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const register = useRegister({ onDone });
  const error = register.error;

  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && password.length >= 8;

  const submit = (event: FormEvent): void => {
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
        {copy.createAndSave}
      </Button>
    </form>
  );
}

/** Email and password. No draft carry-over — see `useLogin`. */
function LogInForm({ onDone }: { readonly onDone: () => void }) {
  const copy = ASK_COPY.saveGate.form;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin({ onDone });
  const error = login.error;

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const submit = (event: FormEvent): void => {
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
        {copy.signInAndSave}
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
