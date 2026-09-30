import { useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Repeat, Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { formatDateTime } from '@shared/utils/format-date';
import { Input } from '@ui/inputs';
import { Button } from '@ui/primitives';
import { InfoCard } from '@ui/admin';
import { Switch } from '@ui/inputs';
import { Tag } from '@ui/status';

import {
  useAdminEmails,
  useEmailKinds,
  useEmailSettings,
  useMailProvider,
  useSetEmailKind,
  useSetMailProvider,
  useTestMailProvider,
} from '../hooks/use-admin';
import { ConsoleShell } from '../parts/console-shell';
import { DataTable, type Column } from '../parts/data-table';
import type { EmailLogRow, MailProvider } from '../services/admin.api';

const STATUS_TONE: Record<string, string> = {
  sent: 'text-success-onsoft',
  failed: 'text-critical-onsoft',
  suppressed: 'text-ink-3',
  blocked: 'text-caution-onsoft',
};

/** Plain English for each kind, so the switches read as decisions. */
const KIND_LABELS: Record<string, { label: string; hint: string }> = {
  welcome: { label: 'Welcome', hint: 'Sent once, when somebody registers.' },
  password_reset: { label: 'Password reset', hint: 'The link somebody asked for. Think hard before switching this off.' },
  password_changed: { label: 'Password changed', hint: 'A security notice after a password changes.' },
  status_changed: { label: 'Account status', hint: 'When an account is suspended or restored.' },
  daily_digest: { label: 'The daily rundown', hint: 'Every morning: what is going off, the weather, what to eat.' },
  weekly_summary: { label: 'Your week', hint: 'Sundays. What they cooked.' },
  low_stock: { label: 'Running low', hint: 'At most weekly, and only when it blocks a meal.' },
  use_it_up: { label: 'Use it up', hint: 'Not currently sent by anything.' },
  have_you_eaten: { label: 'Have you eaten?', hint: 'Not currently sent by anything.' },
  admin_broadcast: { label: 'Written by an operator', hint: 'Anything sent by hand from here.' },
};

const PROVIDER_LABELS: Record<MailProvider, { label: string; hint: string }> = {
  resend: { label: 'Resend', hint: 'Sends as MAIL_FROM.' },
  cloudflare: { label: 'Cloudflare', hint: 'Sends as CLOUDFLARE_MAIL_FROM, on an onboarded domain.' },
};

const PROVIDERS: MailProvider[] = ['resend', 'cloudflare'];

/**
 * Who sends the mail.
 *
 * Switching is allowed even when the target has no credentials — this is also
 * where somebody recovers from a bad setting — so the cost of that is stated
 * plainly instead of being prevented.
 */
function ProviderSwitch() {
  const provider = useMailProvider();
  const setProvider = useSetMailProvider();
  const test = useTestMailProvider();
  const [testTo, setTestTo] = useState('');

  const state = provider.data;

  return (
    <InfoCard title="Who sends it">
      <Show when={provider.isLoading}>
        <div aria-hidden="true" className="h-24 animate-shimmer rounded-blade bg-skeleton" />
      </Show>

      <Show when={state !== undefined}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {PROVIDERS.map((name) => {
              const isActive = state?.provider === name;
              const isConfigured = state?.configured[name] === true;

              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={isActive}
                  disabled={setProvider.isPending}
                  onClick={() => {
                    if (!isActive) setProvider.mutate({ provider: name });
                  }}
                  className={`flex flex-col items-start rounded-blade-xs border px-3 py-2 text-left transition ${
                    isActive ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink-3'
                  }`}
                >
                  <span className="text-sm font-extrabold">{PROVIDER_LABELS[name].label}</span>
                  <span className={`text-xs ${isActive ? 'text-white/70' : 'text-ink-3'}`}>
                    {PROVIDER_LABELS[name].hint}
                  </span>
                  <Show when={!isConfigured}>
                    <span className="mt-1 text-[11px] font-extrabold text-caution-onsoft">
                      No credentials configured
                    </span>
                  </Show>
                </button>
              );
            })}
          </div>

          <Show when={state !== undefined && !state.live}>
            <p className="text-xs font-extrabold text-critical-onsoft">
              {PROVIDER_LABELS[state?.provider ?? 'resend'].label} is selected but has no
              credentials — every email is failing until this is fixed.
            </p>
          </Show>

          <Show when={state?.chosen === false}>
            <p className="text-xs text-ink-3">
              Nobody has chosen yet, so this is the server&rsquo;s default.
            </p>
          </Show>

          <Show when={state?.updated_at !== null && state?.updated_at !== undefined}>
            <p className="text-xs text-ink-3">
              Switched {formatDateTime(state?.updated_at ?? '')}
              {state?.updated_by !== null && ` by ${String(state?.updated_by)}`}.
            </p>
          </Show>

          {/* Proving a provider works BEFORE live traffic depends on it. */}
          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
            <Input
              placeholder="Send a test to…"
              value={testTo}
              onChange={(event) => {
                setTestTo(event.target.value);
              }}
              className="max-w-[220px]"
            />
            {PROVIDERS.map((name) => (
              <Button
                key={name}
                size="sm"
                variant="secondary"
                disabled={testTo.length === 0 || test.isPending}
                onClick={() => {
                  test.mutate({ provider: name, to: testTo });
                }}
              >
                Test {PROVIDER_LABELS[name].label}
              </Button>
            ))}

            <Show when={test.data !== undefined}>
              <span
                className={`text-xs font-extrabold ${
                  test.data?.delivered === true ? 'text-success-onsoft' : 'text-critical-onsoft'
                }`}
              >
                {test.data?.delivered === true
                  ? 'Sent.'
                  : `Failed: ${test.data?.error ?? 'unknown'}`}
              </span>
            </Show>
          </div>
        </div>
      </Show>
    </InfoCard>
  );
}

/**
 * The switches.
 *
 * Off means the app keeps triggering exactly as it did — the send is refused at
 * the one place email leaves, recorded as `blocked`, and still visible below.
 * Nothing upstream knows or cares.
 */
function EmailSwitches() {
  const settings = useEmailSettings();
  const setKind = useSetEmailKind();

  return (
    <InfoCard title="What gets sent">
      <Show when={settings.isLoading}>
        <div aria-hidden="true" className="h-40 animate-shimmer rounded-blade bg-skeleton" />
      </Show>

      <div className="grid gap-4 sm:grid-cols-2">
        <Repeat each={settings.data ?? []}>
          {(setting: { kind: string; enabled: boolean; reason: string | null }) => (
            <div key={setting.kind}>
              <Switch
                checked={setting.enabled}
                onCheckedChange={(enabled) => {
                  setKind.mutate({ kind: setting.kind, enabled });
                }}
                label={KIND_LABELS[setting.kind]?.label ?? setting.kind}
              />
              <p className="mt-1 text-xs text-ink-3">
                {KIND_LABELS[setting.kind]?.hint ?? setting.kind}
              </p>
              <Show when={!setting.enabled}>
                <p className="mt-1 text-xs font-extrabold text-caution-onsoft">
                  Off — nothing of this kind is going out.
                </p>
              </Show>
            </div>
          )}
        </Repeat>
      </div>
    </InfoCard>
  );
}

const COLUMNS: Column<EmailLogRow>[] = [
  {
    key: 'to',
    header: 'To',
    render: (row) => (
      <span className="flex flex-col">
        <span className="font-extrabold text-ink">{row.to}</span>
        <span className="max-w-[280px] truncate text-xs text-ink-3">{row.subject}</span>
      </span>
    ),
  },
  { key: 'kind', header: 'Kind', render: (row) => <Tag size="sm">{row.kind}</Tag> },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <span className="flex flex-col">
        <span className={`text-xs font-extrabold ${STATUS_TONE[row.status] ?? 'text-ink-2'}`}>
          {row.status}
        </span>
        <Show when={row.error !== null}>
          <span className="max-w-[220px] truncate text-[11px] text-critical-onsoft">
            {row.error}
          </span>
        </Show>
      </span>
    ),
  },
  {
    key: 'provider',
    header: 'Via',
    render: (row) => (
      <span className="text-xs text-ink-3">{row.provider ?? '—'}</span>
    ),
  },
  {
    key: 'origin',
    header: 'Origin',
    render: (row) => (
      <span className="text-xs text-ink-3">
        {row.resend_of !== null ? 'resent' : row.sent_by !== null ? 'by hand' : 'automatic'}
      </span>
    ),
  },
  {
    key: 'when',
    header: 'When',
    render: (row) => (
      <span className="font-mono text-xs text-ink-3">
        {formatDateTime(row.created_at)}
      </span>
    ),
  },
];

/**
 * Every email this system has sent.
 *
 * `suppressed` is its own status, not a failure — it means no key was
 * configured, which is a development state rather than an outage.
 */
export default function AdminEmailsScreen() {
  const navigate = useNavigate();
  const [to, setTo] = useState('');
  const [kind, setKind] = useState('');
  const [status, setStatus] = useState('');
  const [provider, setProvider] = useState('');

  const kinds = useEmailKinds();
  const { data, isLoading } = useAdminEmails({
    ...(to.length > 0 && { to }),
    ...(kind.length > 0 && { kind }),
    ...(status.length > 0 && { status }),
    ...(provider.length > 0 && { provider }),
    limit: 100,
  });

  return (
    <ConsoleShell
      active="emails"
      title="Email"
      actions={
        <Button
          size="sm"
          onClick={() => {
            void navigate({ to: ROUTES.ADMIN_EMAIL_NEW });
          }}
        >
          Write one
        </Button>
      }
    >
      <div className="mb-5 flex flex-col gap-5">
        <ProviderSwitch />
        <EmailSwitches />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by address…"
          value={to}
          onChange={(event) => {
            setTo(event.target.value);
          }}
          className="max-w-[240px]"
        />
        <select
          value={kind}
          onChange={(event) => {
            setKind(event.target.value);
          }}
          aria-label="Filter by kind"
          className="rounded-blade-xs border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="">Every kind</option>
          {(kinds.data ?? []).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
          }}
          aria-label="Filter by status"
          className="rounded-blade-xs border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="">Any status</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="suppressed">Suppressed</option>
          <option value="blocked">Blocked</option>
        </select>
        <select
          value={provider}
          onChange={(event) => {
            setProvider(event.target.value);
          }}
          aria-label="Filter by provider"
          className="rounded-blade-xs border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="">Either provider</option>
          <option value="resend">Resend</option>
          <option value="cloudflare">Cloudflare</option>
        </select>

        <Show when={data !== undefined}>
          <span className="ml-auto font-mono text-xs text-ink-3">{data?.total ?? 0} emails</span>
        </Show>
      </div>

      <DataTable
        rows={data?.items ?? []}
        columns={COLUMNS}
        isLoading={isLoading}
        empty="Nothing has been sent that matches."
        rowKey={(row) => row.id}
        onRowClick={(row) => {
          void navigate({ to: ROUTES.ADMIN_EMAIL(row.id) });
        }}
      />
    </ConsoleShell>
  );
}
