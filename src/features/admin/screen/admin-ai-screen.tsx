import { useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { formatDateTime } from '@shared/utils/format-date';
import { Tag } from '@ui/status';

import { useAiLogs, useAiPromptIds } from '../hooks/use-admin';
import { ConsoleShell } from '../parts/console-shell';
import { DataTable, type Column } from '../parts/data-table';
import type { AiLogRow } from '../services/admin.api';

const COLUMNS: Column<AiLogRow>[] = [
  {
    key: 'prompt',
    header: 'Prompt',
    render: (row) => <span className="font-mono text-xs text-ink">{row.prompt_id}</span>,
  },
  {
    key: 'ok',
    header: 'Result',
    render: (row) => (
      <Show
        when={row.ok}
        fallback={
          <span className="flex flex-col">
            <span className="text-xs font-extrabold text-critical-onsoft">rejected</span>
            {/* The zod path that failed. This is the whole reason to look. */}
            <span className="max-w-[280px] truncate text-xs text-ink-3">
              {row.parse_error ?? row.error}
            </span>
          </span>
        }
      >
        <span className="text-xs text-success-onsoft">ok</span>
      </Show>
    ),
  },
  {
    key: 'provider',
    header: 'Provider',
    render: (row) => (
      <Tag tone={row.provider === 'mock' ? 'neutral' : 'info'} size="sm">
        {row.provider}
      </Tag>
    ),
  },
  { key: 'model', header: 'Model', render: (row) => <span className="font-mono text-xs">{row.model}</span> },
  { key: 'tokens', header: 'Tokens', numeric: true, render: (row) => row.total_tokens ?? '—' },
  { key: 'ms', header: 'ms', numeric: true, render: (row) => row.duration_ms },
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

export default function AdminAiScreen() {
  const navigate = useNavigate();
  const [promptId, setPromptId] = useState('');
  const [okFilter, setOkFilter] = useState('');

  const promptIds = useAiPromptIds();
  const { data, isLoading } = useAiLogs({
    ...(promptId.length > 0 && { prompt_id: promptId }),
    ...(okFilter.length > 0 && { ok: okFilter }),
    limit: 100,
  });

  return (
    <ConsoleShell active="ai" title="AI audit">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={promptId}
          onChange={(event) => {
            setPromptId(event.target.value);
          }}
          aria-label="Filter by prompt"
          className="rounded-blade-xs border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="">Every prompt</option>
          {(promptIds.data ?? []).map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>

        <select
          value={okFilter}
          onChange={(event) => {
            setOkFilter(event.target.value);
          }}
          aria-label="Filter by result"
          className="rounded-blade-xs border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="">Any result</option>
          <option value="false">Rejected only</option>
          <option value="true">Accepted only</option>
        </select>

        <Show when={data !== undefined}>
          <span className="ml-auto font-mono text-xs text-ink-3">{data?.total ?? 0} calls</span>
        </Show>
      </div>

      <DataTable
        rows={data?.items ?? []}
        columns={COLUMNS}
        isLoading={isLoading}
        empty="No calls match that."
        rowKey={(row) => row.id}
        onRowClick={(row) => {
          void navigate({ to: ROUTES.ADMIN_AI_LOG(row.id) });
        }}
      />
    </ConsoleShell>
  );
}
