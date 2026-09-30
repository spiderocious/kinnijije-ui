import { useState } from 'react';

import { Show } from 'meemaw';

import { formatDate } from '@shared/utils/format-date';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';

import { useAuditLog } from '../hooks/use-staff';
import { ConsoleShell } from '../parts/console-shell';
import { DataTable, type Column } from '../parts/data-table';
import type { AuditRow } from '../services/staff.api';

/** Renders a before/after pair without drowning the row in JSON. */
function ChangeList({ row }: { readonly row: AuditRow }) {
  if (row.changes === null || row.changes.length === 0) {
    return row.meta === null ? (
      <span className="text-xs text-ink-4">—</span>
    ) : (
      <code className="text-[10px] text-ink-3">{JSON.stringify(row.meta)}</code>
    );
  }

  return (
    <span className="flex flex-col gap-0.5">
      {row.changes.map((change) => (
        <span key={change.field} className="text-[11px]">
          <span className="text-ink-3">{change.field}: </span>
          <span className="text-critical-onsoft line-through">{String(change.from)}</span>
          <span className="text-ink-3"> → </span>
          <span className="font-bold text-ink">{String(change.to)}</span>
        </span>
      ))}
    </span>
  );
}

const COLUMNS: Column<AuditRow>[] = [
  {
    key: 'created_at',
    header: 'When',
    render: (row) => (
      <span className="whitespace-nowrap text-xs text-ink-3">
        {row.created_at === null ? '—' : formatDate(row.created_at)}
      </span>
    ),
  },
  {
    key: 'actor_email',
    header: 'Who',
    render: (row) => (
      <span className="flex flex-col">
        {/* The email is on the ROW, not joined — so this still reads after the
            account it describes has been deleted. */}
        <span className="font-extrabold text-ink">{row.actor_email}</span>
        <span className="text-[11px] text-ink-3">{row.actor_role}</span>
      </span>
    ),
  },
  {
    key: 'action',
    header: 'Did what',
    render: (row) => (
      <span className="flex flex-col gap-1">
        <code className="text-xs font-bold text-ink">{row.action}</code>
        <Show when={row.resource_id !== null}>
          <span className="text-[10px] text-ink-4">{row.resource_id}</span>
        </Show>
      </span>
    ),
  },
  { key: 'changes', header: 'Change', render: (row) => <ChangeList row={row} /> },
  {
    key: 'outcome',
    header: 'Outcome',
    render: (row) => (
      <Tag size="sm" tone={row.outcome === 'success' ? 'info' : 'neutral'}>
        {row.outcome}
      </Tag>
    ),
  },
];

/**
 * What staff have been doing.
 *
 * Denials are one click away deliberately: somebody repeatedly probing what
 * they cannot reach is the single most interesting thing in this collection,
 * and it would otherwise be buried under ordinary successful work.
 */
export default function AdminAuditScreen() {
  const [outcome, setOutcome] = useState<string | undefined>(undefined);
  const { data: rows = [], isLoading } = useAuditLog({ outcome, limit: 100 });

  return (
    <ConsoleShell active="audit" title="Audit trail">
      <div className="mb-4 flex gap-2">
        <Button
          size="sm"
          variant={outcome === undefined ? 'primary' : 'secondary'}
          onClick={() => { setOutcome(undefined); }}
        >
          Everything
        </Button>
        <Button
          size="sm"
          variant={outcome === 'denied' ? 'primary' : 'secondary'}
          onClick={() => { setOutcome('denied'); }}
        >
          Refused
        </Button>
      </div>

      <DataTable
        rows={rows}
        columns={COLUMNS}
        isLoading={isLoading}
        empty={
          outcome === 'denied'
            ? 'Nobody has been refused anything. Good.'
            : 'Nothing recorded yet.'
        }
        rowKey={(row) => row.id}
      />
    </ConsoleShell>
  );
}
