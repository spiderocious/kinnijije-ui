import { useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { formatDate } from '@shared/utils/format-date';
import { MetricTile } from '@ui/admin';
import { Select } from '@ui/inputs';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';

import { useWorkflows } from '../hooks/use-workflows';
import { ConsoleShell } from '../parts/console-shell';
import { DataTable, type Column } from '../parts/data-table';
import type { WorkflowKind, WorkflowRow, WorkflowStatus } from '../services/workflows.api';

/**
 * The approval queue.
 *
 * This screen answers "what is outstanding" — the notifications page answers
 * "what happened since I last looked". Keeping those separate is deliberate:
 * a request raised before somebody was granted the approval scope will never
 * appear in their bell, but it is right here, which is the screen they go to
 * when they want to know what is waiting.
 *
 * Default filter is pending, because a queue that opens on its own history is
 * a report, not a queue.
 */

/** Kind labels, written out rather than derived, so the copy reads as English. */
const KIND_LABEL: Record<WorkflowKind, string> = {
  'recipe.create': 'New recipe',
  'recipe.update': 'Recipe change',
  'recipe.unpublish': 'Unpublish recipe',
  'match.rule.publish': 'Publish rule',
  'match.rule.retire': 'Retire rule',
  'staff.permission.grant': 'Permission grant',
};

/**
 * Status tone.
 *
 * `Tag` offers neutral and info only, so the colour cannot carry the meaning
 * here — the label does. That is the right trade: `failed` and `rejected` mean
 * opposite things and would both have to be red, which would make the colour
 * actively misleading rather than merely uninformative.
 */
const STATUS_LABEL: Record<WorkflowStatus, string> = {
  pending: 'Waiting',
  approved: 'Approved, applying',
  applied: 'Applied',
  rejected: 'Not approved',
  withdrawn: 'Withdrawn',
  failed: 'Did not apply',
};

const STATUS_TONE: Record<WorkflowStatus, 'neutral' | 'info'> = {
  pending: 'info',
  approved: 'info',
  applied: 'neutral',
  rejected: 'neutral',
  withdrawn: 'neutral',
  failed: 'info',
};

const STATUS_OPTIONS: readonly { value: string; label: string }[] = [
  { value: 'pending', label: 'Waiting' },
  { value: 'applied', label: 'Applied' },
  { value: 'rejected', label: 'Not approved' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'failed', label: 'Did not apply' },
  { value: '', label: 'Any status' },
];

const KIND_OPTIONS: readonly { value: string; label: string }[] = [
  { value: '', label: 'Any kind' },
  ...Object.entries(KIND_LABEL).map(([value, label]) => ({ value, label })),
];

export default function AdminWorkflowsScreen() {
  const navigate = useNavigate();

  const [status, setStatus] = useState<string>('pending');
  const [kind, setKind] = useState<string>('');
  const [mine, setMine] = useState(false);

  const { data, isLoading } = useWorkflows({
    ...(status !== '' && { status: status as WorkflowStatus }),
    ...(kind !== '' && { kind: kind as WorkflowKind }),
    ...(mine && { mine: true }),
  });

  const workflows = data?.workflows ?? [];
  const pendingCount = data?.pendingCount ?? 0;

  const columns: Column<WorkflowRow>[] = [
    {
      key: 'targetLabel',
      header: 'What',
      render: (row) => (
        <button
          type="button"
          className="flex flex-col text-left hover:underline"
          onClick={() => {
            void navigate({ to: ROUTES.ADMIN_WORKFLOW(row.id) });
          }}
        >
          <span className="font-extrabold text-ink">{row.targetLabel ?? row.targetType}</span>
          <span className="text-xs text-ink-3">
            {KIND_LABEL[row.kind]}
            <Show when={row.changes !== null && row.changes.length > 0}>
              {` · ${String(row.changes?.length ?? 0)} field${(row.changes?.length ?? 0) === 1 ? '' : 's'}`}
            </Show>
          </span>
        </button>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Tag size="sm" tone={STATUS_TONE[row.status]}>
          {STATUS_LABEL[row.status]}
        </Tag>
      ),
    },
    {
      key: 'requestedBy',
      header: 'Raised by',
      render: (row) => (
        <span className="text-sm text-ink">
          <Show when={row.isMine} fallback={<span className="font-mono text-xs">{row.requestedBy}</span>}>
            <span className="font-extrabold">You</span>
          </Show>
        </span>
      ),
    },
    {
      key: 'requestedAt',
      header: 'When',
      render: (row) => <span className="text-xs text-ink-3">{formatDate(row.requestedAt)}</span>,
    },
    {
      key: 'id',
      header: '',
      render: (row) => (
        <Show when={row.canDecide}>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              void navigate({ to: ROUTES.ADMIN_WORKFLOW(row.id) });
            }}
          >
            Review
          </Button>
        </Show>
      ),
    },
  ];

  return (
    <ConsoleShell active="workflows" title="Approvals">
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricTile label="Waiting" value={pendingCount} />
        <MetricTile label="Shown" value={workflows.length} />
        <MetricTile label="Mine" value={workflows.filter((row) => row.isMine).length} />
        <MetricTile
          label="You can decide"
          value={workflows.filter((row) => row.canDecide).length}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Select
          label="Status"
          value={status}
          onValueChange={setStatus}
          options={STATUS_OPTIONS}
          size="sm"
        />
        <Select
          label="Kind"
          value={kind}
          onValueChange={setKind}
          options={KIND_OPTIONS}
          size="sm"
        />
        {/* The "mine" toggle, so a requester lands on their own requests
            without typing their id into a filter. */}
        <Button
          size="sm"
          variant={mine ? 'primary' : 'secondary'}
          onClick={() => {
            setMine((previous) => !previous);
          }}
        >
          {mine ? 'Showing mine' : 'Only mine'}
        </Button>
      </div>

      <DataTable
        rows={workflows}
        columns={columns}
        isLoading={isLoading}
        empty={
          status === 'pending'
            ? 'Nothing is waiting for approval.'
            : 'No requests match these filters.'
        }
        rowKey={(row) => row.id}
      />
    </ConsoleShell>
  );
}
