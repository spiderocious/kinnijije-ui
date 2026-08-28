import { useState, type FormEvent } from 'react';

import { Link } from '@tanstack/react-router';

import { ROUTES } from '@shared/constants/routes';
import { Button } from '@ui/primitives';
import { Field, Input, PasswordInput } from '@ui/inputs';

import { useLogin } from '../hooks/use-auth-actions';
import { useNextPath } from '../hooks/use-next-path';
import { fieldError } from '../hooks/use-field-errors';
import { AuthShell } from '../parts/auth-shell';
import { FormError } from '../parts/form-error';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = useLogin();
  const next = useNextPath();
  const error = login.error ?? null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    login.mutate({ email: email.trim(), password });
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to pick up where your kitchen left off."
      footer={
        <>
          New here?{' '}
          {/* `next` follows across, so somebody who detours to sign up still
              lands where they were originally going. */}
          <Link
            to={ROUTES.REGISTER}
            {...(next !== null && { search: { next } as never })}
            className="font-extrabold text-sky underline-offset-2 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <FormError error={error} />

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

        <PasswordInput
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          size="lg"
          {...(fieldError(error, 'password') !== undefined && {
            invalid: true,
            error: fieldError(error, 'password'),
          })}
        />

        {/* Without this the reset flow has no way in from the one screen
            where somebody discovers they need it. */}
        <div className="-mt-1 text-right">
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="text-sm text-ink-3 underline-offset-2 hover:underline"
          >
            Forgot your password?
          </Link>
        </div>

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={login.isPending}
          // Guarding on empty fields keeps a pointless round-trip — and a
          // wasted rate-limit token — off the login endpoint.
          disabled={email.trim().length === 0 || password.length === 0}
        >
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
