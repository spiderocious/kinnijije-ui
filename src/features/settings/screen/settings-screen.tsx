import { useState } from 'react';

import { Repeat, Show } from 'meemaw';
import { AppShell } from '@shared/ui-shell/app-shell';

import { useSession, useSignOut } from '@features/auth';
import { useStockUnits } from '@features/stock/hooks/use-stock';
import { Field, Input, Switch } from '@ui/inputs';
import { Button, FilterChip } from '@ui/primitives';
import { Panel } from '@ui/structure';

import { useDeleteAccount, useUpdateSettings } from '../hooks/use-settings';

const CUISINES = ['Nigerian', 'West African', 'Asian', 'Mediterranean', 'Comfort food', 'Continental'];
const DIFFICULTIES = [
  { value: 'easy' as const, label: 'Keep it easy' },
  { value: 'medium' as const, label: 'In between' },
  { value: 'anything' as const, label: 'Anything' },
];

/**
 * Settings that actually persist.
 *
 * Every switch here changes real behaviour — cuisines filter suggestions,
 * location drives the weather in an answer. A toggle that saves nothing is
 * worse than no toggle.
 */
export default function SettingsScreen() {
  const { user } = useSession();
  const signOut = useSignOut();
  const update = useUpdateSettings();
  const deleteAccount = useDeleteAccount();
  const { data: customUnits = [] } = useStockUnits();

  const [city, setCity] = useState(user?.city ?? '');
  const [confirmText, setConfirmText] = useState('');
  const [confirming, setConfirming] = useState(false);

  const cuisines = user?.prefs.cuisines ?? [];

  return (
    <AppShell title="Settings" active="you">
        <div className="flex flex-col gap-5">
          <Panel>
            <Panel.Header title="What you like to cook" />
            <Panel.Body>
              <div className="flex flex-wrap gap-2">
                <Repeat each={CUISINES}>
                  {(cuisine: string) => (
                    <FilterChip
                      key={cuisine}
                      pressed={cuisines.includes(cuisine)}
                      onPressedChange={(pressed) => {
                        update.mutate({
                          cuisines: pressed
                            ? [...cuisines, cuisine]
                            : cuisines.filter((c) => c !== cuisine),
                        });
                      }}
                    >
                      {cuisine}
                    </FilterChip>
                  )}
                </Repeat>
              </div>
              <p className="mt-3 text-sm text-ink-3">
                This filters what you are shown. Pick none and you see everything.
              </p>
            </Panel.Body>
          </Panel>

          <Panel>
            <Panel.Header title="How adventurous" />
            <Panel.Body>
              <div className="flex flex-wrap gap-2">
                <Repeat each={DIFFICULTIES}>
                  {(option: (typeof DIFFICULTIES)[number]) => (
                    <FilterChip
                      key={option.value}
                      pressed={user?.prefs.difficulty === option.value}
                      onPressedChange={() => {
                        update.mutate({ difficulty: option.value });
                      }}
                    >
                      {option.label}
                    </FilterChip>
                  )}
                </Repeat>
              </div>
            </Panel.Body>
          </Panel>

          <Panel>
            <Panel.Header title="How things are measured" />
            <Panel.Body>
              <Switch
                checked={user?.prefs.measurement === 'metric'}
                onCheckedChange={(checked) => {
                  update.mutate({ measurement: checked ? 'metric' : 'imperial' });
                }}
                label="Metric units"
              />
              <p className="mt-3 text-sm text-ink-3">
                Local measures — congo, derica, tin — are always shown alongside.
              </p>

              <Show when={customUnits.length > 0}>
                <div className="mt-4">
                  <p className="text-xs font-extrabold uppercase tracking-overline text-ink-3">
                    Units you added
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Repeat each={[...customUnits]}>
                      {(unit: (typeof customUnits)[number]) => (
                        <span
                          key={unit.id}
                          className="rounded-full border border-line px-3 py-1 text-sm"
                        >
                          {unit.label}
                        </span>
                      )}
                    </Repeat>
                  </div>
                </div>
              </Show>
            </Panel.Body>
          </Panel>

          <Panel>
            <Panel.Header title="Where you are" />
            <Panel.Body>
              <Field label="City" hint="Used to work out the weather, which shapes what gets suggested.">
                {({ id }) => (
                  <Input
                    id={id}
                    value={city}
                    onChange={(event) => {
                      setCity(event.target.value);
                    }}
                    onBlur={() => {
                      if (city !== (user?.city ?? '')) update.mutate({ city });
                    }}
                    placeholder="Lagos"
                  />
                )}
              </Field>
            </Panel.Body>
          </Panel>

          <Panel>
            <Panel.Header title="What we send you" />
            <Panel.Body>
              {/* Each of these is its own switch on purpose. "You are out of
                  rice" and "have you eaten?" are very different things to
                  receive, and one toggle for both meant somebody had to accept
                  the personal one to keep the useful one. */}
              <div className="flex flex-col gap-5">
                <div>
                  <Switch
                    checked={user?.notifications.daily_digest ?? false}
                    onCheckedChange={(checked) => {
                      update.mutate({ daily_digest: checked });
                    }}
                    label="Every morning"
                  />
                  <p className="mt-1 text-xs text-ink-3">
                    What is in your kitchen, what you could cook today, and anything about to turn.
                  </p>
                </div>

                <div>
                  <Switch
                    checked={user?.notifications.weekly_summary ?? false}
                    onCheckedChange={(checked) => {
                      update.mutate({ weekly_summary: checked });
                    }}
                    label="Your week"
                  />
                  <p className="mt-1 text-xs text-ink-3">
                    A note on Sundays about what you cooked. Not a scorecard.
                  </p>
                </div>

                <div>
                  <Switch
                    checked={user?.notifications.running_low ?? false}
                    onCheckedChange={(checked) => {
                      update.mutate({ running_low: checked });
                    }}
                    label="When something runs out"
                  />
                  <p className="mt-1 text-xs text-ink-3">
                    Only when it is blocking a meal you actually make. At most once a week.
                  </p>
                </div>

                <div>
                  <Switch
                    checked={user?.notifications.use_it_up ?? false}
                    onCheckedChange={(checked) => {
                      update.mutate({ use_it_up: checked });
                    }}
                    label="When something is about to turn"
                  />
                  <p className="mt-1 text-xs text-ink-3">
                    Only when we can also tell you what to make with it.
                  </p>
                </div>

                <div>
                  <Switch
                    checked={user?.notifications.have_you_eaten ?? false}
                    onCheckedChange={(checked) => {
                      update.mutate({ have_you_eaten: checked });
                    }}
                    label="Have you eaten?"
                  />
                  <p className="mt-1 text-xs text-ink-3">
                    A question, if it has been quiet for a while. No streaks, nothing to catch up on.
                  </p>
                </div>
              </div>
            </Panel.Body>
          </Panel>

          <Panel>
            <Panel.Header title="How we use AI" />
            <Panel.Body>
              <p className="text-sm text-ink-2">
                When nothing tested matches your kitchen, we ask a model and label the result{' '}
                <b>made by AI</b>. Quantities become estimates and the time is padded by 30%. Photos
                you upload are read once and kept with that reading so a bad result can be checked.
              </p>
            </Panel.Body>
          </Panel>

          <Button variant="secondary" size="lg" onClick={signOut}>
            Sign out
          </Button>

          {/* Typed confirmation: deleting an account is irreversible, so it
              must be harder than a stray tap. */}
          <Panel>
            <Panel.Header title="Delete your account" />
            <Panel.Body>
              <p className="text-sm text-ink-2">
                This removes your kitchen, your market list, your history and everything you saved.
                It cannot be undone.
              </p>

              <Show when={!confirming}>
                <Button
                  variant="secondary"
                  destructive
                  className="mt-3"
                  onClick={() => {
                    setConfirming(true);
                  }}
                >
                  Delete my account
                </Button>
              </Show>

              <Show when={confirming}>
                <div className="mt-3 flex flex-col gap-3">
                  <Field label="Type DELETE to confirm">
                    {({ id }) => (
                      <Input
                        id={id}
                        value={confirmText}
                        onChange={(event) => {
                          setConfirmText(event.target.value);
                        }}
                        placeholder="DELETE"
                      />
                    )}
                  </Field>
                  <div className="flex gap-2">
                    <Button
                      destructive
                      disabled={confirmText !== 'DELETE'}
                      loading={deleteAccount.isPending}
                      onClick={() => {
                        deleteAccount.mutate();
                      }}
                    >
                      Delete permanently
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setConfirming(false);
                        setConfirmText('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Show>
            </Panel.Body>
          </Panel>
        </div>
    </AppShell>
  );
}
