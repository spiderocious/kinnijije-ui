import { useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { Input } from '@ui/inputs';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';

import { useAdminEmails, useEmailKinds } from '../hooks/use-admin';
import { ConsoleShell } from '../parts/console-shell';
import { DataTable, type Column } from '../parts/data-table';
import type { EmailLogRow } from '../services/admin.api';

const STATUS_TONE: Record<string, string> = {
  sent: 'text-success-onsoft',
  failed: 'text-critical-onsoft',
  suppressed: 'text-ink-3',
};

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
        {new Date(row.created_at).toLocaleString()}
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

  const kinds = useEmailKinds();
  const { data, isLoading } = useAdminEmails({
    ...(to.length > 0 && { to }),
    ...(kind.length > 0 && { kind }),
    ...(status.length > 0 && { status }),
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
