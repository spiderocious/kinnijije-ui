import { Repeat, Show } from 'meemaw';
import { cn } from '@shared/utils/cn';
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
/**
 * One outcome line: what people get, or do not get.
 *
 * The live one is marked and legible; the other is dimmed rather than hidden,
 * so the consequence of flipping the switch is readable without flipping it.
 */
function FlagOutcome({
  state,
  text,
  active,
}: {
  readonly state: 'On' | 'Off';
  readonly text: string;
  readonly active: boolean;
}) {
  return (
    <div className={cn('flex gap-2 text-xs', active ? 'text-ink-2' : 'text-ink-4')}>
      <dt
        className={cn(
          'shrink-0 rounded-blade-xs px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide',
          active && state === 'On' && 'bg-success-soft text-success-onsoft',
          active && state === 'Off' && 'bg-caution-soft text-caution-onsoft',
          !active && 'bg-paper-2 text-ink-4',
        )}
      >
        {state}
      </dt>
      <dd className="m-0 min-w-0 flex-1">{text}</dd>
    </div>
  );
}

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

                  {/* Both sentences, always, with the live one marked.
                      An operator throwing a switch is asking one question —
                      what changes for the people using this — and the honest
                      answer is the pair side by side. Printing only `when_off`
                      under a live feature contradicted the switch beside it,
                      which is the one thing this screen must never do. */}
                  <dl className="mt-1.5 flex flex-col gap-1">
                    <FlagOutcome
                      state="On"
                      text={flag.when_on}
                      active={flag.enabled}
                    />
                    <FlagOutcome
                      state="Off"
                      text={flag.when_off}
                      active={!flag.enabled}
                    />
                  </dl>

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
