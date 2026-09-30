import { useState } from 'react';

import { useNavigate, useSearch } from '@tanstack/react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Show } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { ROUTES } from '@shared/constants/routes';
import type { ApiError } from '@shared/services/api-client';
import { Input } from '@ui/inputs';
import { Button } from '@ui/primitives';

import { staffApi } from '../services/staff.api';

/** Matches the server's minimum. Higher than a customer's, deliberately. */
const MIN_LENGTH = 12;

/**
 * Setting a password from an invite link.
 *
 * PUBLIC and outside the console shell: the person has no account yet, so
 * there is nothing to authenticate and no nav to show them.
 *
 * Shows only their name and email — never the scopes they are being given or
 * who invited them. An unauthenticated endpoint should not describe the shape
 * of the organisation to whoever happens to hold a link.
 */
export default function AdminAcceptInviteScreen() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { token?: string };
  const token = search.token ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const invite = useQuery({
    queryKey: ['admin', 'invite', token],
    queryFn: () => staffApi.peekInvite(token),
    enabled: token !== '',
    retry: false,
  });

  const accept = useMutation<void, ApiError, string>({
    mutationFn: (value: string) => staffApi.acceptInvite(token, value),
    onSuccess: () => {
      // Straight to the console sign-in: they have a password now, and
      // signing them in automatically would skip the step that proves it works.
      void navigate({ to: ROUTES.ADMIN_LOGIN, replace: true });
    },
  });

  const tooShort = password.length > 0 && password.length < MIN_LENGTH;
  const mismatch = confirm.length > 0 && password !== confirm;
  const ready = password.length >= MIN_LENGTH && password === confirm;

  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-5">
      <div className="w-full max-w-[420px] rounded-blade border border-line bg-white p-8">
        <Show when={token === '' || invite.isError}>
          <div className="text-center">
            <KoboyoIcon name="lockShownOpenClosed" size={36} className="text-ink-3" alone />
            <h1 className="mt-4 font-display text-xl font-extrabold tracking-display">
              This link has expired
            </h1>
            <p className="mt-2 text-sm text-ink-2">
              Invitations last seven days and work once. Ask whoever invited you to send another.
            </p>
          </div>
        </Show>

        <Show when={invite.isSuccess}>
          <h1 className="font-display text-xl font-extrabold tracking-display text-ink">
            Welcome, {invite.data?.name}
          </h1>
          <p className="mt-1 text-sm text-ink-3">
            Choose a password for {invite.data?.email}. At least {MIN_LENGTH} characters — this
            account can see real customer data.
          </p>

          <div className="mt-5 flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-ink-2">Password</span>
              <Input
                type="password"
                value={password}
                invalid={tooShort}
                {...(tooShort && { error: `At least ${String(MIN_LENGTH)} characters` })}
                onChange={(event) => { setPassword(event.target.value); }}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-ink-2">Again</span>
              <Input
                type="password"
                value={confirm}
                invalid={mismatch}
                {...(mismatch && { error: 'These do not match' })}
                onChange={(event) => { setConfirm(event.target.value); }}
              />
            </label>

            <Button
              fullWidth
              loading={accept.isPending}
              disabled={!ready}
              onClick={() => { accept.mutate(password); }}
            >
              Set my password
            </Button>

            <Show when={accept.error !== null}>
              <p className="text-xs text-critical-onsoft">{accept.error?.message}</p>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  );
}
