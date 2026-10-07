import { useState } from 'react';

import { useNavigate, useParams } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { formatDate } from '@shared/utils/format-date';
import { InfoCard } from '@ui/admin';
import { Callout } from '@ui/feedback';
import { Input } from '@ui/inputs';
import { Button } from '@ui/primitives';

import {
  useApproveWorkflow,
  useRejectWorkflow,
  useWithdrawWorkflow,
  useWorkflow,
} from '../hooks/use-workflows';
import { ConsoleShell } from '../parts/console-shell';
import type { WorkflowChange, WorkflowKind } from '../services/workflows.api';

/**
 * One request, with the diff and the decision.
 *
 * The screen is built around the diff because that is what an approver is
 * actually deciding about. Everything else — who raised it, when, their note —
 * is context for reading the diff, so it sits beside rather than above it.
 */

const KIND_LABEL: Record<WorkflowKind, string> = {
  'recipe.create': 'New recipe',
  'recipe.update': 'Recipe change',
  'recipe.unpublish': 'Unpublish recipe',
  'match.rule.publish': 'Publish rule',
  'match.rule.retire': 'Retire rule',
  'staff.permission.grant': 'Permission grant',
};

/**
 * A value, rendered for reading rather than for parsing.
 *
 * Arrays and objects are the common case here (an ingredient list, a `when`
 * clause), and `JSON.stringify` on one line is unreadable past about three
 * entries. Arrays become comma lists; objects stay as formatted JSON, which is
 * honest about being structured data.
 */
function renderValue(value: unknown): string {
  if (value === null || value === undefined) return 'nothing';
  if (typeof value === 'string') return value === '' ? 'empty' : value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value.length === 0 ? 'empty list' : value.map((item) => renderValue(item)).join(', ');
  }
  return JSON.stringify(value, null, 2);
}

function DiffRow({ change }: { readonly change: WorkflowChange }) {
  return (
    <div className="border-b border-line/60 py-3 last:border-b-0">
      <p className="mb-1 font-mono text-xs uppercase tracking-overline text-ink-3">
        {change.field}
      </p>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="rounded-blade-xs bg-paper-2 p-2">
          <p className="mb-1 text-xs font-extrabold text-ink-3">Now</p>
          <p className="whitespace-pre-wrap break-words text-sm text-ink-2">
            {renderValue(change.from)}
          </p>
        </div>
        <div className="rounded-blade-xs bg-sky-100 p-2">
          <p className="mb-1 text-xs font-extrabold text-sky-on">Proposed</p>
          <p className="whitespace-pre-wrap break-words text-sm text-ink">
            {renderValue(change.to)}
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { readonly label: string; readonly value: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/60 py-2 text-sm last:border-b-0">
      <span className="font-mono text-xs uppercase tracking-overline text-ink-3">{label}</span>
      <span className="min-w-0 break-all text-right text-ink">{value ?? '—'}</span>
    </div>
  );
}

export default function AdminWorkflowDetailScreen() {
  const navigate = useNavigate();
  const { workflowId } = useParams({ strict: false }) as { workflowId?: string };
  const id = workflowId ?? '';

  const { data: workflow, isLoading, error } = useWorkflow(id);
  const approve = useApproveWorkflow();
  const reject = useRejectWorkflow();
  const withdraw = useWithdrawWorkflow();

  const [note, setNote] = useState('');

  const backToQueue = () => {
    void navigate({ to: ROUTES.ADMIN_WORKFLOWS });
  };

  return (
    <ConsoleShell
      active="workflows"
      title={workflow?.targetLabel ?? 'Request'}
      actions={
        <Button size="sm" variant="secondary" onClick={backToQueue}>
          Back to queue
        </Button>
      }
    >
      <Show when={isLoading}>
        <p className="text-sm text-ink-3">Loading…</p>
      </Show>

      <Show when={error !== null && !isLoading}>
        <Callout
          tone="critical"
          title="Could not load this request"
          body={error?.message ?? 'Something went wrong.'}
        />
      </Show>

      <Show when={workflow !== undefined}>
        {/* A failed apply is the one state that needs an engineer, so it is
            called out rather than left as a word in a status chip. */}
        <Show when={workflow?.status === 'failed'}>
          <Callout
            tone="critical"
            title="This was approved but did not apply"
            body={`${workflow?.error ?? 'No error was recorded.'} Nothing changed in production, and raising it again is safe once the cause is fixed.`}
          />
        </Show>

        <Show when={workflow?.status === 'approved'}>
          <Callout
            tone="caution"
            title="Approved, applying now"
            body="If this does not move to applied, the write did not finish and somebody needs to look at it."
          />
        </Show>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <InfoCard title="What changes">
            <Show
              when={(workflow?.changes?.length ?? 0) > 0}
              fallback={
                <p className="text-sm text-ink-3">
                  No field-level diff was recorded. This request creates something new, so
                  there is nothing to compare it against.
                </p>
              }
            >
              <div>
                {(workflow?.changes ?? []).slice().map((change) => (
                  <DiffRow key={change.field} change={change} />
                ))}
              </div>
            </Show>
          </InfoCard>

          <div className="flex flex-col gap-4">
            <InfoCard title="Who and when">
              <Row label="Kind" value={workflow === undefined ? null : KIND_LABEL[workflow.kind]} />
              <Row
                label="Raised by"
                value={workflow?.isMine === true ? 'You' : (workflow?.requestedBy ?? null)}
              />
              <Row
                label="Raised"
                value={workflow === undefined ? null : formatDate(workflow.requestedAt)}
              />
              <Row label="Their note" value={workflow?.note ?? null} />
              <Row label="Decided by" value={workflow?.decidedBy ?? null} />
              <Row
                label="Decided"
                value={
                  workflow?.decidedAt === null || workflow?.decidedAt === undefined
                    ? null
                    : formatDate(workflow.decidedAt)
                }
              />
              <Row label="Decision note" value={workflow?.decisionNote ?? null} />
            </InfoCard>

            {/* The decision box only appears when this viewer can actually
                decide. The service enforces the rule regardless; hiding the
                buttons just avoids offering an action that will 403. */}
            <Show when={workflow?.canDecide === true}>
              <InfoCard title="Your decision">
                <Show when={workflow?.isMine === true}>
                  <Callout
                    tone="caution"
                    title="This is your own request"
                    body="You can approve it because you are an owner. It will be recorded as a self-approval."
                  />
                </Show>

                <Input
                  value={note}
                  onChange={(event) => {
                    setNote(event.target.value);
                  }}
                  placeholder="Why you are approving or rejecting"
                  aria-label="Decision note"
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    loading={approve.isPending}
                    onClick={() => {
                      approve.mutate(
                        { workflowId: id, ...(note !== '' && { note }) },
                        { onSuccess: () => { setNote(''); } },
                      );
                    }}
                  >
                    Approve and apply
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={reject.isPending}
                    onClick={() => {
                      reject.mutate(
                        { workflowId: id, ...(note !== '' && { note }) },
                        { onSuccess: () => { setNote(''); } },
                      );
                    }}
                  >
                    Reject
                  </Button>
                </div>

                {/* The conflict refusal lands here: the message names which
                    fields moved, which is what the requester needs in order to
                    redo it against current state. */}
                <Show when={approve.error !== null}>
                  <div className="mt-3">
                    <Callout
                      tone="critical"
                      title="Could not approve"
                      body={approve.error?.message ?? 'Something went wrong.'}
                    />
                  </div>
                </Show>
                <Show when={reject.error !== null}>
                  <div className="mt-3">
                    <Callout
                      tone="critical"
                      title="Could not reject"
                      body={reject.error?.message ?? 'Something went wrong.'}
                    />
                  </div>
                </Show>
              </InfoCard>
            </Show>

            <Show when={workflow?.status === 'pending' && workflow?.isMine === true}>
              <InfoCard title="Take it back">
                <p className="mb-3 text-sm text-ink-2">
                  Withdrawing is not a rejection. Nobody judged it, and you can raise it again.
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={withdraw.isPending}
                  onClick={() => {
                    withdraw.mutate({ workflowId: id }, { onSuccess: backToQueue });
                  }}
                >
                  Withdraw this request
                </Button>
              </InfoCard>
            </Show>
          </div>
        </div>
      </Show>
    </ConsoleShell>
  );
}
