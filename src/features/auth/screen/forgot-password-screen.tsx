import { useState, type FormEvent } from 'react';

import { Link } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { Callout } from '@ui/feedback';
import { Field, Input } from '@ui/inputs';
import { Button } from '@ui/primitives';

import { useForgotPassword } from '../hooks/use-auth-actions';
import { AuthShell } from '../parts/auth-shell';
import { FormError } from '../parts/form-error';

/**
 * Asking for a reset link.
 *
 * The confirmation is deliberately vague about whether the address exists —
 * saying "no account with that email" would turn this screen into a way to
 * find out who has an account.
 */
export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const forgot = useForgotPassword();

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    forgot.mutate(email.trim());
  };

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Put in your email and we will send you a link to set a new one."
      footer={
        <>
          Remembered it?{' '}
          <Link to={ROUTES.LOGIN} className="font-extrabold text-sky underline-offset-2 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <Show when={forgot.isSuccess}>
        <Callout
          tone="info"
          title="Check your email"
          body="If that address has an account, a link is on its way. It works once and expires in an hour."
        />
      </Show>

      <Show when={!forgot.isSuccess}>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <FormError error={forgot.error ?? null} />

          <Field label="Email">
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
                size="lg"
              />
            )}
          </Field>

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={forgot.isPending}
            disabled={email.trim().length === 0}
          >
            Send me a link
          </Button>
        </form>
      </Show>
    </AuthShell>
  );
}
