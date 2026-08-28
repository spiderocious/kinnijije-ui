import { useEffect, useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Repeat, Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { InfoCard } from '@ui/admin';
import { Callout } from '@ui/feedback';
import { Field, Input } from '@ui/inputs';
import { Button } from '@ui/primitives';

import { useAdminUsers, usePreviewAudience, useSendEmail } from '../hooks/use-admin';
import { ConsoleShell } from '../parts/console-shell';
import type { EmailAudience } from '../services/admin.api';

const AUDIENCES: { value: EmailAudience; label: string; hint: string }[] = [
  { value: 'all', label: 'Everyone', hint: 'Excludes banned and deleted accounts.' },
  { value: 'active', label: 'Active accounts', hint: 'Verified and in good standing.' },
  { value: 'pending', label: 'Not yet verified', hint: 'Signed up, never confirmed.' },
  { value: 'onboarded', label: 'Finished onboarding', hint: 'They have a kitchen set up.' },
  { value: 'not_onboarded', label: 'Never finished onboarding', hint: 'Signed up and stopped.' },
  { value: 'selected', label: 'Pick people', hint: 'Choose specific accounts below.' },
];

/**
 * Writing an email to people.
 *
 * The count is confirmed BEFORE the send button does anything — an operator
 * about to write to nine hundred people should be told so first, and the
 * preview is the only thing standing between a typo and everybody's inbox.
 */
export default function AdminEmailNewScreen() {
  const navigate = useNavigate();

  const [audience, setAudience] = useState<EmailAudience>('active');
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [confirming, setConfirming] = useState(false);

  const users = useAdminUsers(
    audience === 'selected' ? { ...(search.length > 0 && { search }), limit: 50 } : { limit: 1 },
  );
  const preview = usePreviewAudience();
  const send = useSendEmail();

  const { mutate: runPreview } = preview;
  useEffect(() => {
    // Any change to who it goes to invalidates the confirmation.
    setConfirming(false);
    runPreview({
      audience,
      ...(audience === 'selected' && { userIds: selected }),
    });
  }, [audience, selected, runPreview]);

  const count = preview.data?.count ?? 0;
  const ready = subject.trim().length > 0 && body.trim().length > 0 && count > 0;

  return (
    <ConsoleShell
      active="emails"
      title="Write an email"
      actions={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            void navigate({ to: ROUTES.ADMIN_EMAILS });
          }}
        >
          Back
        </Button>
      }
    >
      <Show when={send.isSuccess}>
        <Callout
          tone="info"
          title="Sent"
          body={`${String(send.data?.sent ?? 0)} delivered${(send.data?.failed ?? 0) > 0 ? `, ${String(send.data?.failed ?? 0)} failed` : ''}.`}
          className="mb-4"
        />
      </Show>

      <Show when={send.error !== null}>
        <Callout tone="critical" title="It did not send" body={send.error?.message} className="mb-4" />
      </Show>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <InfoCard title="The message">
          <Field label="Subject">
            {({ id }) => (
              <Input
                id={id}
                value={subject}
                onChange={(event) => {
                  setSubject(event.target.value);
                  setConfirming(false);
                }}
                placeholder="Something short and true"
              />
            )}
          </Field>

          <div className="mt-4">
            <p className="mb-1.5 font-mono text-xs uppercase tracking-overline text-ink-3">body</p>
            <textarea
              value={body}
              onChange={(event) => {
                setBody(event.target.value);
                setConfirming(false);
              }}
              rows={16}
              placeholder={'Write in plain sentences.\n\nA blank line starts a new paragraph.'}
              className="w-full rounded-blade-sm border border-line bg-white p-3 text-sm text-ink focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]"
            />
            <p className="mt-1.5 text-xs text-ink-3">
              It goes out in the normal KinniJije frame, addressed to each person by name, with an
              unsubscribe line. Plain text — no HTML.
            </p>
          </div>
        </InfoCard>

        <div className="flex flex-col gap-4">
          <InfoCard title="Who gets it">
            <div className="flex flex-col gap-2">
              <Repeat each={AUDIENCES}>
                {(option: { value: EmailAudience; label: string; hint: string }) => (
                  <label key={option.value} className="flex cursor-pointer items-start gap-2">
                    <input
                      type="radio"
                      name="audience"
                      checked={audience === option.value}
                      onChange={() => {
                        setAudience(option.value);
                      }}
                      className="mt-1 accent-sky"
                    />
                    <span>
                      <span className="block text-sm font-extrabold text-ink">{option.label}</span>
                      <span className="block text-xs text-ink-3">{option.hint}</span>
                    </span>
                  </label>
                )}
              </Repeat>
            </div>

            <Show when={audience === 'selected'}>
              <div className="mt-4">
                <Input
                  placeholder="Search accounts…"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                  }}
                />
                <div className="mt-2 max-h-[240px] overflow-y-auto rounded-blade-sm border border-line">
                  <Repeat each={users.data?.items ?? []}>
                    {(user: { id: string; email: string }) => (
                      <label
                        key={user.id}
                        className="flex cursor-pointer items-center gap-2 border-b border-line/60 px-3 py-2 text-sm last:border-0"
                      >
                        <input
                          type="checkbox"
                          checked={selected.includes(user.id)}
                          onChange={(event) => {
                            setSelected((current) =>
                              event.target.checked
                                ? [...current, user.id]
                                : current.filter((id) => id !== user.id),
                            );
                          }}
                          className="accent-sky"
                        />
                        <span className="min-w-0 truncate">{user.email}</span>
                      </label>
                    )}
                  </Repeat>
                </div>
              </div>
            </Show>
          </InfoCard>

          <InfoCard title="Before you send" tone={count > 50 ? 'caution' : 'default'}>
            <p className="text-sm text-ink">
              This goes to <span className="font-extrabold">{count}</span>{' '}
              {count === 1 ? 'person' : 'people'}.
            </p>

            <Show when={(preview.data?.sample.length ?? 0) > 0}>
              <p className="mt-2 font-mono text-xs text-ink-3">
                {preview.data?.sample.join(', ')}
                {count > (preview.data?.sample.length ?? 0) ? ' …' : ''}
              </p>
            </Show>

            {/* Two steps, deliberately. There is no recalling an email. */}
            <Show when={!confirming}>
              <Button
                className="mt-4"
                fullWidth
                disabled={!ready}
                onClick={() => {
                  setConfirming(true);
                }}
              >
                Review and send
              </Button>
            </Show>

            <Show when={confirming}>
              <p className="mt-4 text-sm font-extrabold text-caution-onsoft">
                Send &ldquo;{subject}&rdquo; to {count} {count === 1 ? 'person' : 'people'}? This
                cannot be taken back.
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  loading={send.isPending}
                  onClick={() => {
                    send.mutate({
                      audience,
                      ...(audience === 'selected' && { user_ids: selected }),
                      subject: subject.trim(),
                      body: body.trim(),
                    });
                    setConfirming(false);
                  }}
                >
                  Yes, send it
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setConfirming(false);
                  }}
                >
                  Wait
                </Button>
              </div>
            </Show>
          </InfoCard>
        </div>
      </div>
    </ConsoleShell>
  );
}
