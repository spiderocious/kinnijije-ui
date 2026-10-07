import { useState } from 'react';

import { useNavigate, useParams } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { usePermissions } from '@shared/hooks/use-permissions';
import { ROUTES } from '@shared/constants/routes';
import { formatDate } from '@shared/utils/format-date';
import { InfoCard, MetricTile } from '@ui/admin';
import { Callout } from '@ui/feedback';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';

import {
  usePermissionGroups,
  useSetStaffPermissions,
  useStaffMember,
} from '../hooks/use-staff';
import { ConsoleShell } from '../parts/console-shell';
import type { EffectiveScope, StaffActivityEntry } from '../services/staff.api';

/**
 * One colleague, in full.
 *
 * The screen exists to answer three questions the staff LIST cannot, because a
 * table row has no room for any of them:
 *
 *   1. "Why can she do that?" — every scope with its provenance. Most of what
 *      somebody can do was never ticked by anybody: it came with a group, or
 *      by implication from a stronger grant. A screen showing only the granted
 *      array describes a person who can do LESS than they really can, which is
 *      the dangerous direction to be wrong in.
 *   2. "What has he been up to?" — the audit trail, filtered to this actor.
 *   3. "Is somebody stuck?" — refused attempts. Repeated denials are a person
 *      hitting a wall they should be past, and that signal appears nowhere
 *      else in the console.
 */

/** How a scope was come by, in the order an operator finds useful. */
const VIA_LABEL: Record<EffectiveScope['via'], string> = {
  tier: 'owner',
  group: 'group',
  direct: 'granted',
  implied: 'implied',
};

/**
 * `Tag` offers neutral and info only — the semantic colours belong to
 * `Status`, which is registry-driven by lifecycle kind and has no entry for
 * "how a permission was come by". So provenance uses the two tones it has:
 * info for something somebody chose, neutral for everything else.
 *
 * That is not a compromise. An implied scope is real but was never picked, and
 * dressing it in the same colour as a deliberate grant is how operators lose
 * track of what they actually handed out.
 */
const VIA_TONE: Record<EffectiveScope['via'], 'neutral' | 'info'> = {
  tier: 'neutral',
  group: 'info',
  direct: 'info',
  implied: 'neutral',
};

function Row({ label, value }: { readonly label: string; readonly value: string | number | null }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/60 py-2 text-sm">
      <span className="font-mono text-xs uppercase tracking-overline text-ink-3">{label}</span>
      <span className="min-w-0 break-all text-right text-ink">{value ?? '—'}</span>
    </div>
  );
}

/** A scope with its origin. Grouped by resource so the list is scannable. */
function ScopeRow({ entry }: { readonly entry: EffectiveScope }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/60 py-1.5">
      <code className="font-mono text-[11px] text-ink">{entry.scope}</code>
      <span className="flex shrink-0 items-center gap-1.5">
        <Show when={entry.source !== null}>
          <span className="text-[10px] text-ink-4">{entry.source}</span>
        </Show>
        <Tag size="sm" tone={VIA_TONE[entry.via]}>
          {VIA_LABEL[entry.via]}
        </Tag>
      </span>
    </div>
  );
}

function ActivityRow({ entry }: { readonly entry: StaffActivityEntry }) {
  const denied = entry.outcome === 'denied';

  return (
    <div className="border-b border-line/60 py-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-2">
          <code className="font-mono text-[11px] font-semibold text-ink">{entry.action}</code>
          {/* Refusals are called out rather than listed flatly: they are the
              most interesting rows in the trail. Styled directly rather than
              through `Status`, which is keyed by lifecycle kind and has no
              entry for an audit outcome. */}
          <Show when={denied}>
            <span className="rounded-blade-xs border border-critical-border bg-critical-soft px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-overline text-critical-onsoft">
              refused
            </span>
          </Show>
        </span>
        <span className="shrink-0 text-[10px] text-ink-4">
          {entry.created_at === null ? '—' : formatDate(entry.created_at)}
        </span>
      </div>

      {/* The before/after, which is the question people actually ask of a
          trail. Capped at three fields so one broad edit cannot push every
          other entry off the screen. */}
      <Show when={entry.changes !== null && entry.changes.length > 0}>
        <div className="mt-1 flex flex-col gap-0.5">
          {(entry.changes ?? []).slice(0, 3).map((change) => (
            <span key={change.field} className="text-[10.5px] text-ink-3">
              <span className="font-semibold text-ink-2">{change.field}</span>
              {': '}
              <span className="line-through opacity-60">{summarise(change.from)}</span>
              {' → '}
              <span>{summarise(change.to)}</span>
            </span>
          ))}
          <Show when={(entry.changes?.length ?? 0) > 3}>
            <span className="text-[10px] text-ink-4">
              and {(entry.changes?.length ?? 0) - 3} more
            </span>
          </Show>
        </div>
      </Show>
    </div>
  );
}

/**
 * A changed value, short enough for one line.
 *
 * The permissions field carries a 20-item array, so printing it raw makes the
 * trail unreadable — the COUNT is what a reader needs at a glance.
 */
function summarise(value: unknown): string {
  if (value === null || value === undefined) return 'none';
  if (Array.isArray(value)) return value.length === 0 ? 'none' : `${String(value.length)} items`;
  if (typeof value === 'object') return 'changed';
  return String(value);
}

export default function AdminStaffDetailScreen() {
  const navigate = useNavigate();
  const { staffId } = useParams({ strict: false }) as { staffId: string };

  const { data, isLoading, error } = useStaffMember(staffId);
  const { data: groups = [] } = usePermissionGroups();
  const setPermissions = useSetStaffPermissions();
  const { can } = usePermissions();

  const [editing, setEditing] = useState(false);

  const mayManage = can('staff:write');
  // Both halves: the server decides, and it already told us whether this
  // particular person is editable (not yourself, not an owner above you).
  const mayEdit = mayManage && data?.editable === true;

  return (
    <ConsoleShell
      active="staff"
      title={data?.name ?? 'Staff'}
      actions={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            void navigate({ to: ROUTES.ADMIN_STAFF });
          }}
        >
          Back
        </Button>
      }
    >
      <Show when={isLoading}>
        <div aria-hidden="true" className="h-64 animate-shimmer rounded-blade bg-skeleton" />
      </Show>

      <Show when={error !== null}>
        <Callout tone="critical" title="Could not load this person" body={error?.message} />
      </Show>

      <Show when={data !== undefined}>
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile label="Can do" value={data?.effective.length ?? 0} icon="lockShownOpenClosed" />
            <MetricTile label="Actions" value={data?.activity.length ?? 0} icon="historyClockArrow" />
            {/* The signal that exists nowhere else: somebody repeatedly
                refused is somebody blocked from doing their job. */}
            <MetricTile label="Refused" value={data?.denied_count ?? 0} icon="shield" />
            <MetricTile
              label="Groups"
              value={data?.group_keys.length ?? 0}
              icon="emptyStateForTeam"
            />
          </div>

          <Show when={(data?.denied_count ?? 0) >= 5}>
            <Callout
              tone="caution"
              title="This person keeps being refused"
              body={`${String(data?.denied_count ?? 0)} attempts have been turned down. Either they are reaching for something they should have, or something is pointing them at the wrong screen.`}
            />
          </Show>

          <Show when={data?.status === 'suspended' || data?.status === 'revoked'}>
            <Callout
              tone="critical"
              title={`Console access ${data?.status ?? ''}`}
              body={data?.status_reason ?? 'No reason was recorded.'}
            />
          </Show>

          <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <div className="flex flex-col gap-4">
              <InfoCard title="Account">
                <Row label="name" value={data?.name ?? null} />
                <Row label="email" value={data?.email ?? null} />
                <Row label="tier" value={data?.tier ?? null} />
                <Row label="status" value={data?.status ?? null} />
                <Row
                  label="last seen"
                  value={
                    data?.last_console_login_at == null
                      ? 'never'
                      : formatDate(data.last_console_login_at)
                  }
                />
                <Row
                  label="joined"
                  value={data?.created_at == null ? null : formatDate(data.created_at)}
                />
                {/* Context, and nothing more: the two identities are separate
                    and this confers no access either way. */}
                <Row
                  label="also a customer"
                  value={data?.has_customer_account === true ? 'yes' : 'no'}
                />
              </InfoCard>

              <Show when={data?.invite !== null}>
                <InfoCard
                  title="Invitation"
                  tone={data?.invite?.expired === true ? 'caution' : 'default'}
                >
                  <Row
                    label="expires"
                    value={
                      data?.invite?.expires_at == null
                        ? null
                        : formatDate(data.invite.expires_at)
                    }
                  />
                  <Row
                    label="state"
                    value={data?.invite?.expired === true ? 'expired' : 'outstanding'}
                  />
                </InfoCard>
              </Show>

              <Show when={mayEdit}>
                <InfoCard
                  title="Change access"
                  action={
                    <Button
                      size="sm"
                      variant="tertiary"
                      onClick={() => {
                        setEditing(!editing);
                      }}
                    >
                      {editing ? 'Cancel' : 'Edit'}
                    </Button>
                  }
                >
                  <Show when={!editing}>
                    <p className="py-1 text-xs text-ink-3">
                      Groups applied:{' '}
                      {data?.group_keys.length === 0
                        ? 'none'
                        : data?.group_keys
                            .map(
                              (key) =>
                                groups.find((group) => group.key === key)?.name ?? key,
                            )
                            .join(', ')}
                    </p>
                  </Show>

                  <Show when={editing}>
                    <div className="flex flex-col gap-2 py-1">
                      <div className="flex flex-wrap gap-2">
                        {groups.map((group) => (
                          <Button
                            key={group.key}
                            size="sm"
                            variant={
                              data?.group_keys.includes(group.key) === true
                                ? 'primary'
                                : 'secondary'
                            }
                            loading={setPermissions.isPending}
                            onClick={() => {
                              setPermissions.mutate(
                                { userId: staffId, group_keys: [group.key], scopes: [] },
                                { onSuccess: () => { setEditing(false); } },
                              );
                            }}
                          >
                            {group.name}
                          </Button>
                        ))}
                      </div>
                      <p className="text-[11px] text-ink-3">
                        This signs them out, so their next sign-in reflects the change rather
                        than a half-working console.
                      </p>
                      <Show when={setPermissions.error !== null}>
                        <p className="text-[11px] text-critical-onsoft">
                          {setPermissions.error?.message}
                        </p>
                      </Show>
                    </div>
                  </Show>
                </InfoCard>
              </Show>

              {/* Why the buttons are absent, rather than leaving somebody to
                  wonder. Three different reasons, each worth naming. */}
              <Show when={mayManage && data?.editable === false}>
                <InfoCard title="Read only" tone="caution">
                  <p className="py-1 text-xs text-ink-2">
                    {staffId === data?.id && data?.tier === 'super_admin'
                      ? 'Nobody edits their own permissions, and an owner holds everything by tier rather than by grant.'
                      : 'You cannot edit this person: either it is your own account, or they are an owner and you are not.'}
                  </p>
                </InfoCard>
              </Show>
            </div>

            <div className="flex flex-col gap-4">
              <InfoCard
                title={`What they can do (${String(data?.effective.length ?? 0)})`}
              >
                <Show when={data?.tier === 'super_admin'}>
                  <p className="py-1 text-xs text-ink-2">
                    An owner bypasses the permission check entirely rather than holding
                    individual scopes, so there is nothing here to grant or remove.
                  </p>
                </Show>

                <Show when={data?.tier !== 'super_admin' && data?.effective.length === 0}>
                  <p className="py-1 text-xs text-ink-3">
                    Nothing yet. They can reach the console and see the dashboard, and no more.
                  </p>
                </Show>

                <Show when={data?.tier !== 'super_admin' && (data?.effective.length ?? 0) > 0}>
                  <div className="flex flex-col">
                    {(data?.effective ?? []).map((entry) => (
                      <ScopeRow key={entry.scope} entry={entry} />
                    ))}
                  </div>
                </Show>
              </InfoCard>

              <InfoCard title="Recent activity">
                <Show when={data?.activity.length === 0}>
                  <p className="py-1 text-xs text-ink-3">
                    Nothing recorded. Reading a screen is not an action; this shows changes.
                  </p>
                </Show>
                <div className="flex flex-col">
                  {(data?.activity ?? []).map((entry) => (
                    <ActivityRow key={entry.id} entry={entry} />
                  ))}
                </div>
              </InfoCard>
            </div>
          </div>
        </div>
      </Show>
    </ConsoleShell>
  );
}
