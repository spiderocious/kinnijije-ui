import { useState, type FormEvent } from 'react';

import { KoboyoIcon } from '@icons';
import { Field, Input, PasswordInput } from '@ui/inputs';
import { Button } from '@ui/primitives';

import { useLogin } from '@features/auth/hooks/use-auth-actions';
import { fieldError } from '@features/auth/hooks/use-field-errors';
import { FormError } from '@features/auth/parts/form-error';

/**
 * Signing in to the console.
 *
 * The same credentials endpoint as the consumer app — there is one identity
 * system, and the ROLE decides what you can reach. A second login path would be
 * a second thing to get wrong.
 */
export default function AdminLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = useLogin();
  const error = login.error ?? null;

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    login.mutate({ email: email.trim(), password });
  };

  return (
    <div className="counter grid min-h-dvh place-items-center bg-paper px-5 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 text-center">
          <KoboyoIcon name="cookingPot" size={36} className="text-sky" alone />
          <h1 className="mt-3 font-display text-2xl font-extrabold tracking-display">
            Console sign in
          </h1>
          <p className="mt-1 text-sm text-ink-2">Operators only.</p>
        </div>

        <form
          onSubmit={submit}
          noValidate
          className="flex flex-col gap-4 rounded-blade border border-line bg-white p-6"
        >
          <FormError error={error} />

          <Field label="Email" error={fieldError(error, 'email')}>
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
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

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={login.isPending}
            disabled={email.trim().length === 0 || password.length === 0}
          >
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
