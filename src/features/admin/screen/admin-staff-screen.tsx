import { useState } from 'react';

import { Show } from 'meemaw';

import { usePermissions } from '@shared/hooks/use-permissions';
import { formatDate } from '@shared/utils/format-date';
import { Input, Select } from '@ui/inputs';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';

import {
  useInviteStaff,
  usePermissionGroups,
  useRevokeInvite,
  useSetStaffPermissions,
  useStaff,
} from '../hooks/use-staff';
import { ConsoleShell } from '../parts/console-shell';
import { DataTable, type Column } from '../parts/data-table';
import type { StaffRow } from '../services/staff.api';

/**
 * Colleagues, separate from customers.
 *
 * Ten staff mixed into a list of thousands of cooks makes the staff
 * unfindable, which is why this is its own screen rather than a filter on
 * Users.
 */
export default function AdminStaffScreen() {
  const { data: staff = [], isLoading } = useStaff();
  const { data: groups = [] } = usePermissionGroups();
  const { can } = usePermissions();

  const invite = useInviteStaff();
  const revoke = useRevokeInvite();
  const setPermissions = useSetStaffPermissions();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [groupKey, setGroupKey] = useState('');
  const [editing, setEditing] = useState<string | null>(null);

  const mayManage = can('staff:write');
  const chosenGroup = groups.find((group) => group.key === groupKey);

  const columns: Column<StaffRow>[] = [
    {
      key: 'email',
      header: 'Person',
      render: (row) => (
        <span className="flex flex-col">
          <span className="font-extrabold text-ink">{row.name}</span>
          <span className="text-xs text-ink-3">{row.email}</span>
        </span>
      ),
    },
    { key: 'tier', header: 'Tier', render: (row) => <Tag size="sm">{row.tier}</Tag> },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span className="flex flex-col gap-1">
          <Tag size="sm" tone={row.status === 'active' ? 'info' : 'neutral'}>
            {row.status}
          </Tag>
          {/* An expired invite is SHOWN rather than hidden — somebody has to
              chase it, and a person who silently vanished is worse. */}
          <Show when={row.invite !== null}>
            <span className="text-[11px] text-ink-3">
              {row.invite?.expired === true ? 'invite expired' : 'invite pending'}
            </span>
          </Show>
        </span>
      ),
    },
    {
      key: 'group_keys',
      header: 'Access',
      render: (row) => (
        <span className="flex flex-wrap gap-1">
          <Show when={row.group_keys.length === 0}>
            <span className="text-xs text-ink-4">
              {row.tier === 'super_admin' ? 'everything (owner)' : 'none'}
            </span>
          </Show>
          {row.group_keys.map((key) => (
            <Tag key={key} size="sm" tone="info">
              {groups.find((group) => group.key === key)?.name ?? key}
            </Tag>
          ))}
        </span>
      ),
    },
    {
      key: 'last_login_at',
      header: 'Last seen',
      render: (row) => (
        <span className="text-xs text-ink-3">
          {row.last_console_login_at === null ? 'never' : formatDate(row.last_console_login_at)}
        </span>
      ),
    },
    {
      key: 'id',
      header: '',
      render: (row) =>
        !mayManage || row.tier === 'super_admin' ? null : (
          <span className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setEditing(editing === row.id ? null : row.id);
              }}
            >
              Access
            </Button>
            <Show when={row.invite !== null}>
              <Button
                size="sm"
                variant="tertiary"
                loading={revoke.isPending}
                onClick={() => {
                  revoke.mutate(row.id);
                }}
              >
                Revoke
              </Button>
            </Show>
          </span>
        ),
    },
  ];

  return (
    <ConsoleShell active="staff" title="Staff">
      <Show when={mayManage}>
        <div className="mb-5 rounded-blade border border-line bg-white p-4">
          <h2 className="mb-1 font-display text-base font-extrabold text-ink">Invite somebody</h2>
          <p className="mb-3 text-xs text-ink-3">
            They get an email with a link that works once, for seven days. They choose their own
            password — nobody here ever sees it.
          </p>

          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-ink-2">Email</span>
              <Input
                value={email}
                onChange={(event) => { setEmail(event.target.value); }}
                placeholder="colleague@example.com"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-ink-2">Name</span>
              <Input
                value={name}
                onChange={(event) => { setName(event.target.value); }}
                placeholder="Their name"
              />
            </label>
            <Select
              label="Access"
              value={groupKey === '' ? undefined : groupKey}
              onValueChange={setGroupKey}
              placeholder="Choose a group…"
              options={groups.map((group) => ({ value: group.key, label: group.name }))}
            />
            <Button
              loading={invite.isPending}
              disabled={email === '' || name === '' || groupKey === ''}
              onClick={() => {
                invite.mutate(
                  {
                    email,
                    name,
                    // Moderator is the console's ordinary staff tier; admin is
                    // reserved for somebody who needs the whole thing.
                    tier: 'moderator',
                    group_keys: [groupKey],
                    scopes: [],
                  },
                  {
                    onSuccess: () => {
                      setEmail('');
                      setName('');
                      setGroupKey('');
                    },
                  },
                );
              }}
            >
              Send invite
            </Button>
          </div>

          {/* What the group ACTUALLY confers, before anybody grants it.
              "Content editor" does not tell an operator that it includes
              spending money on image generation. */}
          <Show when={chosenGroup !== undefined}>
            <div className="mt-3 rounded-blade-xs border border-line-2 bg-paper-2 p-3">
              <p className="text-xs text-ink-2">{chosenGroup?.description}</p>
              <p className="mt-2 flex flex-wrap gap-1">
                {chosenGroup?.effective.map((scope) => (
                  <code key={scope} className="rounded bg-white px-1.5 py-0.5 text-[10px] text-ink-3">
                    {scope}
                  </code>
                ))}
              </p>
            </div>
          </Show>

          <Show when={invite.error !== null}>
            <p className="mt-2 text-xs text-critical-onsoft">{invite.error?.message}</p>
          </Show>
        </div>
      </Show>

      <DataTable
        rows={staff}
        columns={columns}
        isLoading={isLoading}
        empty="Nobody but you yet."
        rowKey={(row) => row.id}
      />

      <Show when={editing !== null}>
        <div className="mt-5 rounded-blade border border-line bg-white p-4">
          <h2 className="mb-3 font-display text-base font-extrabold text-ink">Change access</h2>
          <div className="flex flex-wrap gap-2">
            {groups.map((group) => (
              <Button
                key={group.key}
                size="sm"
                variant="secondary"
                loading={setPermissions.isPending}
                onClick={() => {
                  if (editing === null) return;
                  setPermissions.mutate(
                    { userId: editing, group_keys: [group.key], scopes: [] },
                    { onSuccess: () => { setEditing(null); } },
                  );
                }}
              >
                {group.name}
              </Button>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-3">
            Changing this signs them out, so their next sign-in reflects it rather than a
            half-working console.
          </p>
          <Show when={setPermissions.error !== null}>
            <p className="mt-2 text-xs text-critical-onsoft">{setPermissions.error?.message}</p>
          </Show>
        </div>
      </Show>
    </ConsoleShell>
  );
}
