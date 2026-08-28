import { useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { Input } from '@ui/inputs';
import { Tag } from '@ui/status';

import { useAdminUsers } from '../hooks/use-admin';
import { ConsoleShell } from '../parts/console-shell';
import { DataTable, type Column } from '../parts/data-table';
import type { AdminUserRow } from '../services/admin.api';

const COLUMNS: Column<AdminUserRow>[] = [
  {
    key: 'email',
    header: 'Account',
    render: (row) => (
      <span className="flex flex-col">
        <span className="font-extrabold text-ink">{row.email}</span>
        <Show when={row.name !== null}>
          <span className="text-xs text-ink-3">{row.name}</span>
        </Show>
      </span>
    ),
  },
  { key: 'role', header: 'Role', render: (row) => <Tag size="sm">{row.role}</Tag> },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <Tag tone={row.status === 'active' ? 'info' : 'neutral'} size="sm">
        {row.status}
      </Tag>
    ),
  },
  {
    key: 'verified',
    header: 'Verified',
    render: (row) => (
      <span className={row.email_verified ? 'text-success-onsoft' : 'text-ink-3'}>
        {row.email_verified ? 'yes' : 'no'}
      </span>
    ),
  },
  {
    key: 'onboarded',
    header: 'Onboarded',
    render: (row) => (
      <span className={row.has_onboarded ? 'text-success-onsoft' : 'text-caution-onsoft'}>
        {row.has_onboarded ? 'yes' : 'no'}
      </span>
    ),
  },
  {
    key: 'created',
    header: 'Joined',
    render: (row) => (
      <span className="font-mono text-xs text-ink-3">
        {new Date(row.created_at).toLocaleDateString()}
      </span>
    ),
  },
];

export default function AdminUsersScreen() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useAdminUsers({
    ...(search.length > 0 && { search }),
    ...(status.length > 0 && { status }),
    limit: 100,
  });

  return (
    <ConsoleShell active="users" title="Users">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search email or name…"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
          }}
          className="max-w-[280px]"
        />
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
          }}
          aria-label="Filter by status"
          className="rounded-blade-xs border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>

        <Show when={data !== undefined}>
          <span className="ml-auto font-mono text-xs text-ink-3">{data?.total ?? 0} total</span>
        </Show>
      </div>

      <DataTable
        rows={data?.items ?? []}
        columns={COLUMNS}
        isLoading={isLoading}
        empty="Nobody matches that."
        rowKey={(row) => row.id}
        onRowClick={(row) => {
          void navigate({ to: ROUTES.ADMIN_USER(row.id) });
        }}
      />
    </ConsoleShell>
  );
}
