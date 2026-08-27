import { useState, type FormEvent } from 'react';

import { Link } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { Button } from '@ui/primitives';
import { Field, Input, PasswordInput } from '@ui/inputs';

import { useRegister } from '../hooks/use-auth-actions';
import { fieldError } from '../hooks/use-field-errors';
import { AuthShell } from '../parts/auth-shell';
import { FormError } from '../parts/form-error';

/**
 * Mirrors the server's policy so a person is told before submitting rather
 * than after. The SERVER is still the authority — this is a courtesy, not a
 * substitute, and the server's own field errors override whatever is said here.
 */
const PASSWORD_RULE = 'At least 8 characters, with an uppercase letter, a lowercase letter and a digit.';

function localPasswordProblem(password: string): string | undefined {
  if (password.length === 0) return undefined;
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
  if (!/\d/.test(password)) return 'Password must contain a digit';
  return undefined;
}

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const register = useRegister();
  const error = register.error ?? null;

  const localProblem = localPasswordProblem(password);
  // The server's answer wins: it may know something the client rule does not.
  const passwordProblem = fieldError(error, 'password') ?? localProblem;

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    localProblem === undefined;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    register.mutate({ name: name.trim(), email: email.trim(), password });
  };

  return (
    <AuthShell
      title="Set up your kitchen"
      subtitle="Tell it what you have. It tells you what to cook tonight."
      footer={
        <>
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} className="font-extrabold text-sky underline-offset-2 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <FormError error={error} />

        <Field label="Your name" error={fieldError(error, 'name')}>
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              autoComplete="name"
              placeholder="Ada"
              value={name}
              onChange={(event) => setName(event.target.value)}
              invalid={fieldError(error, 'name') !== undefined}
              size="lg"
            />
          )}
        </Field>

        <Field label="Email" error={fieldError(error, 'email')}>
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              invalid={fieldError(error, 'email') !== undefined}
              size="lg"
            />
          )}
        </Field>

        <div>
          <PasswordInput
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            size="lg"
            showStrength
            {...(passwordProblem !== undefined && { invalid: true, error: passwordProblem })}
          />
          {/* The rule is stated up front; once there is a real error the field
              shows that instead, so the two never compete for the same slot. */}
          <Show when={passwordProblem === undefined}>
            <p className="mt-1.5 text-xs text-ink-3">{PASSWORD_RULE}</p>
          </Show>
        </div>

        <Button type="submit" size="lg" fullWidth loading={register.isPending} disabled={!canSubmit}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
