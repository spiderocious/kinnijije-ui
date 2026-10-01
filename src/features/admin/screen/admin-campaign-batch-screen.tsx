import { useState } from 'react';

import { useNavigate, useParams } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { usePermissions } from '@shared/hooks/use-permissions';
import { ROUTES } from '@shared/constants/routes';
import { Input } from '@ui/inputs';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';

import {
  useApproveBatch,
  useBatch,
  useDiscardBatch,
  useEditDraft,
  useExcludeDraft,
} from '../hooks/use-campaigns';
import { ConsoleShell } from '../parts/console-shell';
import type { DraftRow } from '../services/campaigns.api';

/** One recipient's email, with what it was built from. */
function DraftCard({ draft, mayWrite }: { readonly draft: DraftRow; readonly mayWrite: boolean }) {
  const edit = useEditDraft();
  const exclude = useExcludeDraft();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(draft.subject);
  const [text, setText] = useState(draft.text);

  const isExcluded = draft.status === 'excluded';

  return (
    <div
      className={`rounded-blade border bg-white p-3 ${
        isExcluded ? 'border-line opacity-60' : 'border-line'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex flex-col">
          <span className="text-sm font-extrabold text-ink">{draft.email}</span>
          <span className="text-xs text-ink-3">{draft.subject}</span>
        </span>

        {/* The repetition bug, made visible per row. */}
        <Show when={draft.is_duplicate}>
          <Tag size="sm" tone="neutral">same copy as others</Tag>
        </Show>
        <Show when={draft.status === 'edited'}>
          <Tag size="sm" tone="info">edited</Tag>
        </Show>
        <Show when={isExcluded}>
          <Tag size="sm" tone="neutral">excluded</Tag>
        </Show>

        <span className="ml-auto flex gap-2">
          <Button size="sm" variant="tertiary" onClick={() => { setOpen(!open); }}>
            {open ? 'Hide' : 'Preview'}
          </Button>
          <Show when={mayWrite && !isExcluded}>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setEditing(!editing);
                setOpen(true);
              }}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="tertiary"
              loading={exclude.isPending}
              onClick={() => { exclude.mutate({ draftId: draft.id }); }}
            >
              Remove
            </Button>
          </Show>
        </span>
      </div>

      <Show when={open}>
        {/* What it was built FROM — lets a reviewer see why it says this,
            without re-running the build. */}
        <div className="mt-2 rounded-blade-xs border border-line-2 bg-paper-2 p-2">
          <code className="text-[10px] leading-relaxed text-ink-3">
            {JSON.stringify(draft.inputs)}
          </code>
        </div>

        <Show when={!editing}>
          <pre className="mt-2 max-h-80 overflow-auto rounded-blade-xs bg-paper-2 p-3 text-[11px] leading-relaxed text-ink-2">
            {draft.text}
          </pre>
        </Show>

        <Show when={editing}>
          <div className="mt-2 flex flex-col gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-ink-2">Subject</span>
              <Input value={subject} onChange={(e) => { setSubject(e.target.value); }} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-ink-2">Body</span>
              <textarea
                className="min-h-48 rounded-blade-xs border border-line-2 bg-white p-2 font-mono text-[11px] text-ink-2"
                value={text}
                onChange={(e) => { setText(e.target.value); }}
              />
            </label>
            <span className="flex gap-2">
              <Button
                size="sm"
                loading={edit.isPending}
                onClick={() => {
                  edit.mutate(
                    { draftId: draft.id, subject, text },
                    { onSuccess: () => { setEditing(false); } },
                  );
                }}
              >
                Save for this person
              </Button>
              <Button size="sm" variant="tertiary" onClick={() => { setEditing(false); }}>
                Cancel
              </Button>
            </span>
          </div>
        </Show>
      </Show>
    </div>
  );
}

/**
 * One drafted batch, reviewed before anything is sent.
 *
 * Near-identical drafts are surfaced at the top rather than left to be found by
 * scrolling: a batch of four hundred identical emails looks like four hundred
 * fine emails until somebody can see them grouped.
 */
export default function AdminCampaignBatchScreen() {
  const navigate = useNavigate();
  const { batchId } = useParams({ strict: false }) as { batchId: string };
  const { data: batch, isLoading } = useBatch(batchId);
  const { can } = usePermissions();

  const approve = useApproveBatch();
  const discard = useDiscardBatch();
  const [onlyDuplicates, setOnlyDuplicates] = useState(false);

  const mayWrite = can('emails:write');
  const drafts = batch?.drafts ?? [];
  const shown = onlyDuplicates ? drafts.filter((draft) => draft.is_duplicate) : drafts;
  const pending = batch?.status === 'pending_review';

  return (
    <ConsoleShell active="campaigns" title={batch?.kind ?? 'Batch'}>
      <Show when={isLoading}>
        <p className="text-sm text-ink-3">Loading…</p>
      </Show>

      <Show when={batch !== undefined}>
        <div className="mb-4 rounded-blade border border-line bg-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Tag size="sm" tone={pending ? 'info' : 'neutral'}>{batch?.status}</Tag>
            <span className="text-sm text-ink-2">
              {batch?.draft_count} drafts · {batch?.excluded_count} skipped ·{' '}
              {batch?.edited_count} edited · {batch?.sent_count} sent
            </span>

            <span className="ml-auto flex gap-2">
              <Show when={mayWrite && pending}>
                <Button
                  size="sm"
                  loading={approve.isPending}
                  onClick={() => {
                    approve.mutate(batchId, {
                      onSuccess: () => { void navigate({ to: ROUTES.ADMIN_CAMPAIGNS }); },
                    });
                  }}
                >
                  Approve &amp; send {batch?.draft_count}
                </Button>
                <Button
                  size="sm"
                  variant="tertiary"
                  loading={discard.isPending}
                  onClick={() => {
                    discard.mutate(batchId, {
                      onSuccess: () => { void navigate({ to: ROUTES.ADMIN_CAMPAIGNS }); },
                    });
                  }}
                >
                  Discard
                </Button>
              </Show>
            </span>
          </div>

          {/* The thing most worth seeing before approving. */}
          <Show when={(batch?.duplicate_groups.length ?? 0) > 0}>
            <div className="mt-3 rounded-blade-xs border border-caution-border bg-caution-soft p-3">
              <p className="text-xs font-bold text-caution-onsoft">
                {batch?.duplicate_groups.length} group
                {batch?.duplicate_groups.length === 1 ? '' : 's'} of identical copy — the largest
                covers {batch?.duplicate_groups[0]?.count} people.
              </p>
              <p className="mt-1 text-xs text-caution-onsoft">
                Worth checking before approving: identical wording across recipients usually means
                the generation had nothing personal to work from.
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-2"
                onClick={() => { setOnlyDuplicates(!onlyDuplicates); }}
              >
                {onlyDuplicates ? 'Show all' : 'Show only duplicates'}
              </Button>
            </div>
          </Show>

          <Show when={Object.keys(batch?.skip_reasons ?? {}).length > 0}>
            <p className="mt-3 flex flex-wrap gap-1">
              {Object.entries(batch?.skip_reasons ?? {}).map(([reason, count]) => (
                <code key={reason} className="rounded bg-paper-2 px-1.5 py-0.5 text-[10px] text-ink-3">
                  {count} {reason}
                </code>
              ))}
            </p>
          </Show>
        </div>

        <div className="flex flex-col gap-2">
          {shown.map((draft) => (
            <DraftCard key={draft.id} draft={draft} mayWrite={mayWrite} />
          ))}
          <Show when={shown.length === 0}>
            <p className="text-sm text-ink-3">Nothing to show.</p>
          </Show>
        </div>
      </Show>
    </ConsoleShell>
  );
}
