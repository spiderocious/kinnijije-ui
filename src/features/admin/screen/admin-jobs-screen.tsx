import { useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { formatDateTime } from '@shared/utils/format-date';
import { Tag } from '@ui/status';

import { useAdminJobs, useJobTypes } from '../hooks/use-admin';
import { ConsoleShell } from '../parts/console-shell';
import { DataTable, type Column } from '../parts/data-table';
import type { AdminJobRow } from '../services/admin.api';

const STATUS_TONE: Record<string, string> = {
  succeeded: 'text-success-onsoft',
  failed: 'text-critical-onsoft',
  running: 'text-info-onsoft',
  queued: 'text-ink-2',
  cancelled: 'text-ink-3',
};

const COLUMNS: Column<AdminJobRow>[] = [
  {
    key: 'id',
    header: 'Job',
    render: (row) => (
      <span className="flex flex-col">
        <span className="font-mono text-xs text-ink">{row.type}</span>
        <span className="max-w-[220px] truncate font-mono text-[11px] text-ink-3">{row.id}</span>
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <span className={`text-xs font-extrabold ${STATUS_TONE[row.status] ?? 'text-ink-2'}`}>
        {row.status}
      </span>
    ),
  },
  {
    key: 'progress',
    header: 'Progress',
    render: (row) => (
      <span className="flex flex-col">
        <span className="text-xs tabular-nums text-ink-2">
          {Math.round(row.progress * 100)}%
        </span>
        <Show when={row.progress_label !== null}>
          <span className="max-w-[200px] truncate text-[11px] text-ink-3">
            {row.progress_label}
          </span>
        </Show>
      </span>
    ),
  },
  {
    key: 'attempts',
    header: 'Tries',
    numeric: true,
    render: (row) => `${String(row.attempts)}/${String(row.max_attempts)}`,
  },
  {
    key: 'error',
    header: 'Error',
    render: (row) => (
      <Show when={row.error !== null} fallback={<span className="text-ink-3">—</span>}>
        <span className="block max-w-[260px] truncate text-xs text-critical-onsoft">
          {row.error}
        </span>
      </Show>
    ),
  },
  {
    key: 'when',
    header: 'Created',
    render: (row) => (
      <span className="font-mono text-xs text-ink-3">
        {formatDateTime(row.created_at)}
      </span>
    ),
  },
];

export default function AdminJobsScreen() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');

  const types = useJobTypes();
  const { data, isLoading } = useAdminJobs({
    ...(status.length > 0 && { status }),
    ...(type.length > 0 && { type }),
    limit: 100,
  });

  return (
    <ConsoleShell active="jobs" title="Jobs">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
          }}
          aria-label="Filter by status"
          className="rounded-blade-xs border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="">Any status</option>
          <option value="queued">Queued</option>
          <option value="running">Running</option>
          <option value="succeeded">Succeeded</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={type}
          onChange={(event) => {
            setType(event.target.value);
          }}
          aria-label="Filter by type"
          className="rounded-blade-xs border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="">Every type</option>
          {(types.data ?? []).map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>

        <Show when={data !== undefined}>
          <span className="ml-auto font-mono text-xs text-ink-3">{data?.total ?? 0} jobs</span>
        </Show>
        <Tag size="sm">refreshes on its own</Tag>
      </div>

      <DataTable
        rows={data?.items ?? []}
        columns={COLUMNS}
        isLoading={isLoading}
        empty="No jobs match that."
        rowKey={(row) => row.id}
        onRowClick={(row) => {
          void navigate({ to: ROUTES.ADMIN_JOB(row.id) });
        }}
      />
    </ConsoleShell>
  );
}
