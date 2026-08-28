import { Repeat, Show } from 'meemaw';
import { formatDateTime } from '@shared/utils/format-date';

import { InfoCard } from '@ui/admin';
import { Callout } from '@ui/feedback';
import { Switch } from '@ui/inputs';

import { useFeatureFlags, useSetFeatureFlag } from '../hooks/use-admin';
import { ConsoleShell } from '../parts/console-shell';
import type { FeatureFlagRow } from '../services/admin.api';

/**
 * Settings: what the product is allowed to do.
 *
 * Everything is ON until somebody turns it off — a flag with no row is enabled,
 * so a new feature ships live without a migration and switching one off is an
 * explicit act with a name against it.
 *
 * The consumer app FAILS OPEN on these: if the flag request breaks, every
 * feature shows. A flaky network must not quietly strip the product back.
 */
export default function AdminSettingsScreen() {
  const flags = useFeatureFlags();
  const setFlag = useSetFeatureFlag();

  const offCount = (flags.data ?? []).filter((flag) => !flag.enabled).length;

  return (
    <ConsoleShell active="settings" title="Settings">
      <Show when={setFlag.error !== null}>
        <Callout
          tone="critical"
          title="That switch did not save"
          body={setFlag.error?.message}
          className="mb-4"
        />
      </Show>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <InfoCard title="Features">
          <Show when={flags.isLoading}>
            <div aria-hidden="true" className="h-48 animate-shimmer rounded-blade bg-skeleton" />
          </Show>

          <div className="flex flex-col gap-5">
            <Repeat each={flags.data ?? []}>
              {(flag: FeatureFlagRow) => (
                <div key={flag.key}>
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={(enabled) => {
                      setFlag.mutate({ flag: flag.key, enabled });
                    }}
                    label={flag.label}
                  />

                  {/* What breaks, written beside the switch — the person
                      turning something off needs to know what stops. */}
                  <p className="mt-1 text-xs text-ink-3">{flag.when_off}</p>

                  <Show when={!flag.enabled}>
                    <p className="mt-1 text-xs font-extrabold text-caution-onsoft">
                      Off for everybody
                      {flag.updated_at === null
                        ? ''
                        : ` — since ${formatDateTime(flag.updated_at)}`}
                    </p>
                  </Show>

                  <Show when={flag.reason !== null}>
                    <p className="mt-0.5 text-xs text-ink-3">Reason: {flag.reason}</p>
                  </Show>
                </div>
              )}
            </Repeat>
          </div>
        </InfoCard>

        <InfoCard title="How these behave" tone={offCount > 0 ? 'caution' : 'default'}>
          <Show
            when={offCount > 0}
            fallback={<p className="text-sm text-ink-2">Everything is on.</p>}
          >
            <p className="text-sm font-extrabold text-caution-onsoft">
              {offCount} feature{offCount === 1 ? '' : 's'} switched off.
            </p>
          </Show>

          <ul className="mt-3 flex flex-col gap-2 text-xs text-ink-2">
            <li>
              Switching one off takes effect within about thirty seconds — the app caches the
              answer briefly so it is not asking on every page load.
            </li>
            <li>
              A switched-off way in is <b>removed</b>, not greyed out. A dead button invites
              somebody to keep pressing it.
            </li>
            <li>
              Typing is never behind a flag. However much is switched off, somebody can always
              fill their kitchen by hand.
            </li>
            <li>
              If the flags cannot be read at all, everything shows. A blip must not strip the
              product back.
            </li>
          </ul>
        </InfoCard>
      </div>
    </ConsoleShell>
  );
}
