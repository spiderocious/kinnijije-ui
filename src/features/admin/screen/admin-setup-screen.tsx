import { useNavigate } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { ROUTES } from '@shared/constants/routes';
import { Callout } from '@ui/feedback';
import { Button } from '@ui/primitives';

import { useBootstrap, useSetupState } from '../hooks/use-admin';

/**
 * Creating the first administrator.
 *
 * The password appears exactly ONCE, here, and is never sent anywhere else —
 * so the screen says that plainly rather than letting somebody navigate away
 * assuming they can find it again.
 */
export default function AdminSetupScreen() {
  const navigate = useNavigate();
  const setup = useSetupState();
  const bootstrap = useBootstrap();

  const credentials = bootstrap.data;

  return (
    <div className="counter grid min-h-dvh place-items-center bg-paper px-5 py-10">
      <div className="w-full max-w-[520px]">
        <div className="mb-6 text-center">
          <KoboyoIcon name="cookingPot" size={36} className="text-sky" alone />
          <h1 className="mt-3 font-display text-2xl font-extrabold tracking-display">
            Set up the console
          </h1>
        </div>

        {/* Already done. There is no second set of credentials, by design. */}
        <Show when={setup.data?.needs_setup === false && credentials === undefined}>
          <Callout
            tone="info"
            title="Already set up"
            body="An administrator exists, so this can no longer create one. Sign in instead — or reset it in the database if the credentials are lost."
          />
          <Button
            className="mt-4"
            fullWidth
            onClick={() => {
              void navigate({ to: ROUTES.ADMIN_LOGIN });
            }}
          >
            Go to sign in
          </Button>
        </Show>

        <Show when={setup.data?.needs_setup === true && credentials === undefined}>
          <div className="rounded-blade border border-line bg-white p-6">
            <p className="text-sm text-ink-2">
              There is no administrator yet. This creates one and shows you its password.
            </p>
            <p className="mt-2 text-sm font-extrabold text-ink">
              The password is shown once and stored only as a hash. Copy it before you leave this
              page.
            </p>

            <Button
              className="mt-5"
              fullWidth
              loading={bootstrap.isPending}
              onClick={() => {
                bootstrap.mutate();
              }}
            >
              Create the administrator
            </Button>

            <Show when={bootstrap.error !== null}>
              <Callout
                tone="critical"
                title="That did not work"
                body={bootstrap.error?.message}
                className="mt-4"
              />
            </Show>
          </div>
        </Show>

        <Show when={credentials !== undefined}>
          <div className="rounded-blade border border-success-border bg-success-soft p-6">
            <p className="text-sm font-extrabold text-success-onsoft">
              Done. Write these down now.
            </p>

            <dl className="mt-4 flex flex-col gap-3">
              <div>
                <dt className="font-mono text-xs uppercase tracking-overline text-ink-3">email</dt>
                <dd className="select-all break-all font-mono text-sm text-ink">
                  {credentials?.email}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-xs uppercase tracking-overline text-ink-3">
                  password
                </dt>
                <dd className="select-all break-all rounded-blade-sm bg-white px-3 py-2 font-mono text-sm font-extrabold text-ink">
                  {credentials?.password}
                </dd>
              </div>
            </dl>

            <p className="mt-4 text-xs text-ink-2">
              This page cannot show it again, and nothing was emailed. Losing it means resetting the
              account in the database.
            </p>

            <Button
              className="mt-5"
              fullWidth
              onClick={() => {
                void navigate({ to: ROUTES.ADMIN_LOGIN });
              }}
            >
              I have written it down — sign in
            </Button>
          </div>
        </Show>

        <Show when={setup.isLoading}>
          <div aria-hidden="true" className="h-48 animate-shimmer rounded-blade bg-paper-2" />
        </Show>
      </div>
    </div>
  );
}
