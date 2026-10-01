import { useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { usePermissions } from '@shared/hooks/use-permissions';
import { ROUTES } from '@shared/constants/routes';
import { formatDate } from '@shared/utils/format-date';
import { Input, Select } from '@ui/inputs';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';

import {
  useBatches,
  useCampaignOverview,
  useDraftNow,
  useUpdateEmailSettings,
} from '../hooks/use-campaigns';
import { ConsoleShell } from '../parts/console-shell';
import type { KindOverview } from '../services/campaigns.api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** `07:00 Africa/Lagos, daily` — the thing an operator actually wants to read. */
function scheduleLabel(kind: KindOverview): string {
  const { hour, minute, dayOfWeek, timezone } = kind.schedule;
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const when = dayOfWeek === null ? 'daily' : (DAYS[dayOfWeek] ?? 'weekly');
  return `${time} ${timezone}, ${when}`;
}

/**
 * Why people were skipped, biggest reason first.
 *
 * THE FEEDBACK LOOP for the eligibility rules: "88 empty_kitchen" is the only
 * thing that tells an operator a floor is set wrong. Without it, rules are
 * guesswork.
 */
function SkipReasons({ reasons }: { readonly reasons: Record<string, number> }) {
  const entries = Object.entries(reasons).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return <span className="text-xs text-ink-4">none skipped</span>;

  return (
    <span className="flex flex-wrap gap-1">
      {entries.map(([reason, count]) => (
        <code key={reason} className="rounded bg-paper-2 px-1.5 py-0.5 text-[10px] text-ink-3">
          {count} {reason}
        </code>
      ))}
    </span>
  );
}

function KindCard({ kind }: { readonly kind: KindOverview }) {
  const { can } = usePermissions();
  const draftNow = useDraftNow();
  const update = useUpdateEmailSettings();
  const [open, setOpen] = useState(false);

  const [hour, setHour] = useState(String(kind.schedule.hour));
  const [timezone, setTimezone] = useState(kind.schedule.timezone);
  const [minStock, setMinStock] = useState(String(kind.rules.minStockItems));

  const mayWrite = can('emails:write');

  return (
    <div className="rounded-blade border border-line bg-white p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1">
          <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-ink">
            <code>{kind.kind}</code>
            <Tag size="sm" tone={kind.enabled ? 'info' : 'neutral'}>
              {kind.enabled ? 'on' : 'off'}
            </Tag>
            <Show when={kind.auto_approve}>
              <Tag size="sm" tone="neutral">sends without review</Tag>
            </Show>
          </h2>
          <p className="mt-1 text-xs text-ink-3">
            {scheduleLabel(kind)} · next {formatDate(kind.next_run)}
          </p>
          <p className="mt-1 text-xs text-ink-3">
            {kind.opted_in} opted in · {kind.sent_all_time} sent all time
            <Show when={kind.pending_review > 0}>
              <span className="font-bold text-ink"> · {kind.pending_review} waiting for review</span>
            </Show>
          </p>
        </div>

        <span className="flex gap-2">
          <Show when={mayWrite}>
            <Button
              size="sm"
              variant="secondary"
              loading={draftNow.isPending}
              onClick={() => { draftNow.mutate(kind.kind); }}
            >
              Draft now
            </Button>
            <Button size="sm" variant="tertiary" onClick={() => { setOpen(!open); }}>
              Settings
            </Button>
          </Show>
        </span>
      </div>

      <Show when={kind.last_batch !== null}>
        <div className="mt-3 rounded-blade-xs border border-line-2 bg-paper-2 p-3">
          <p className="text-xs font-bold text-ink-2">
            Last run {formatDate(kind.last_batch?.created_at ?? '')} —{' '}
            {kind.last_batch?.drafted} drafted, {kind.last_batch?.sent} sent,{' '}
            {kind.last_batch?.failed} failed
          </p>
          <div className="mt-1.5">
            <SkipReasons reasons={kind.last_batch?.skip_reasons ?? {}} />
          </div>
        </div>
      </Show>

      <Show when={open}>
        <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-line pt-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-ink-2">Hour (0–23)</span>
            <Input value={hour} onChange={(e) => { setHour(e.target.value); }} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-ink-2">Timezone</span>
            <Input value={timezone} onChange={(e) => { setTimezone(e.target.value); }} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-ink-2">Min things in kitchen</span>
            <Input value={minStock} onChange={(e) => { setMinStock(e.target.value); }} />
          </label>

          <Button
            size="sm"
            loading={update.isPending}
            onClick={() => {
              update.mutate({
                kind: kind.kind,
                patch: {
                  schedule: {
                    hour: Number(hour),
                    minute: kind.schedule.minute,
                    dayOfWeek: kind.schedule.dayOfWeek,
                    timezone,
                  },
                  rules: { ...kind.rules, minStockItems: Number(minStock) },
                },
              });
            }}
          >
            Save
          </Button>

          <Button
            size="sm"
            variant="tertiary"
            loading={update.isPending}
            onClick={() => {
              update.mutate({ kind: kind.kind, patch: { enabled: !kind.enabled } });
            }}
          >
            {kind.enabled ? 'Turn off' : 'Turn on'}
          </Button>

          <Show when={update.error !== null}>
            <p className="w-full text-xs text-critical-onsoft">{update.error?.message}</p>
          </Show>
        </div>
      </Show>
    </div>
  );
}

/**
 * The automated-email dashboard.
 *
 * Not a batch list — a view of the whole domain: what each kind is doing, when
 * it next runs, who is opted in, and why people were skipped last time.
 */
export default function AdminCampaignsScreen() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { data, isLoading } = useCampaignOverview();
  const [statusFilter, setStatusFilter] = useState('');
  const [kindFilter, setKindFilter] = useState('');

  const { data: batches = [] } = useBatches({
    ...(kindFilter !== '' && { kind: kindFilter }),
    ...(statusFilter !== '' && { status: statusFilter }),
  });

  const kinds = data?.kinds ?? [];
  const waiting = kinds.reduce((sum, kind) => sum + kind.pending_review, 0);

  return (
    <ConsoleShell
      active="campaigns"
      title="Automated email"
      actions={
        <Show when={can('emails:write')}>
          <Button
            size="sm"
            onClick={() => {
              void navigate({ to: ROUTES.ADMIN_CAMPAIGN_COMPOSE });
            }}
          >
            Compose
          </Button>
        </Show>
      }
    >
      <Show when={waiting > 0}>
        <div className="mb-4 rounded-blade border border-caution-border bg-caution-soft p-3 text-sm text-caution-onsoft">
          <b>{waiting}</b> batch{waiting === 1 ? '' : 'es'} waiting for review. Nothing sends until
          somebody approves it.
        </div>
      </Show>

      <Show when={isLoading}>
        <p className="text-sm text-ink-3">Loading…</p>
      </Show>

      <div className="flex flex-col gap-3">
        {kinds.map((kind) => (
          <KindCard key={kind.kind} kind={kind} />
        ))}
      </div>

      <h2 className="mb-2 mt-7 font-display text-lg font-extrabold text-ink">Recent batches</h2>

      <div className="mb-3 flex flex-wrap gap-3">
        <Select
          label="Kind"
          value={kindFilter === '' ? undefined : kindFilter}
          onValueChange={setKindFilter}
          placeholder="Any kind"
          options={kinds.map((kind) => ({ value: kind.kind, label: kind.kind }))}
        />
        <Select
          label="Status"
          value={statusFilter === '' ? undefined : statusFilter}
          onValueChange={setStatusFilter}
          placeholder="Any status"
          options={[
            { value: 'pending_review', label: 'Pending review' },
            { value: 'sent', label: 'Sent' },
            { value: 'discarded', label: 'Discarded' },
          ]}
        />
      </div>

      <div className="flex flex-col gap-2">
        {batches.map((batch) => (
          <button
            key={batch.id}
            type="button"
            className="flex flex-wrap items-center gap-3 rounded-blade border border-line bg-white p-3 text-left hover:border-sky-edge"
            onClick={() => {
              void navigate({ to: ROUTES.ADMIN_CAMPAIGN_BATCH(batch.id) });
            }}
          >
            <code className="text-xs font-bold text-ink">{batch.kind}</code>
            <Tag size="sm" tone={batch.status === 'pending_review' ? 'info' : 'neutral'}>
              {batch.status}
            </Tag>
            <span className="text-xs text-ink-3">
              {batch.draft_count} drafts · {batch.sent_count} sent · {batch.excluded_count} skipped
            </span>
            <Show when={batch.source === 'composer'}>
              <Tag size="sm" tone="neutral">composed by hand</Tag>
            </Show>
            <span className="ml-auto text-xs text-ink-4">{formatDate(batch.created_at ?? '')}</span>
          </button>
        ))}
        <Show when={batches.length === 0}>
          <p className="text-sm text-ink-3">No batches match.</p>
        </Show>
      </div>
    </ConsoleShell>
  );
}
