import { useState, type FormEvent } from 'react';

import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { Callout } from '@ui/feedback';
import { PasswordInput } from '@ui/inputs';
import { Button } from '@ui/primitives';

import { useResetPassword } from '../hooks/use-auth-actions';
import { fieldError } from '../hooks/use-field-errors';
import { AuthShell } from '../parts/auth-shell';
import { FormError } from '../parts/form-error';

/**
 * Setting a new password from an emailed link.
 *
 * The token comes from the URL and is never shown. Using it signs out every
 * device, so this ends at the sign-in screen rather than logging them in — the
 * session it would have created was just revoked.
 */
export default function ResetPasswordScreen() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { token?: string };
  const token = search.token ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const reset = useResetPassword();
  const error = reset.error ?? null;

  const mismatch = confirm.length > 0 && password !== confirm;

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    if (mismatch) return;
    reset.mutate({ token, newPassword: password });
  };

  // No token in the url at all — a truncated or hand-typed link.
  if (token.length === 0) {
    return (
      <AuthShell
        title="That link is incomplete"
        subtitle="It may have been cut short by your email app."
        footer={
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="font-extrabold text-sky underline-offset-2 hover:underline"
          >
            Ask for a new link
          </Link>
        }
      >
        <Callout
          tone="caution"
          title="No reset code found"
          body="Open the link straight from the email, or ask for a fresh one."
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Then sign in with it — everything else gets signed out."
      footer={
        <Link to={ROUTES.LOGIN} className="font-extrabold text-sky underline-offset-2 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <Show when={reset.isSuccess}>
        <Callout
          tone="success"
          title="Done"
          body="Your password is changed and every device was signed out. Sign in with the new one."
        />
        <Button
          className="mt-4"
          size="lg"
          fullWidth
          onClick={() => {
            void navigate({ to: ROUTES.LOGIN });
          }}
        >
          Go to sign in
        </Button>
      </Show>

      <Show when={!reset.isSuccess}>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <FormError error={error} />

          <PasswordInput
            label="New password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            size="lg"
            {...(fieldError(error, 'new_password') !== undefined && {
              invalid: true,
              error: fieldError(error, 'new_password'),
            })}
          />

          <PasswordInput
            label="Type it again"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            size="lg"
            {...(mismatch && { invalid: true, error: 'Those two do not match' })}
          />

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={reset.isPending}
            disabled={password.length === 0 || mismatch}
          >
            Save it
          </Button>
        </form>
      </Show>
    </AuthShell>
  );
}
