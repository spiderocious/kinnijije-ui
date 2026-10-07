import { useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { formatDate } from '@shared/utils/format-date';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';

import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '../hooks/use-workflows';
import { ConsoleShell } from '../parts/console-shell';
import type { NotificationKind, NotificationRow } from '../services/workflows.api';

/**
 * The bell, in full.
 *
 * Notifications answer "what happened since I last looked". The approvals
 * queue answers "what is outstanding". They are different questions and this
 * page does not try to be both.
 *
 * ONE CONSEQUENCE WORTH KNOWING: the audience for an approval request is
 * resolved when the request is raised, so somebody granted the approval scope
 * afterwards will not see it here. They will see it in the queue. That is the
 * deliberate tradeoff, documented in notification.model.ts on the backend.
 */

const KIND_LABEL: Record<NotificationKind, string> = {
  'approval.needed': 'Needs approval',
  'request.approved': 'Approved',
  'request.rejected': 'Not approved',
  'request.failed': 'Did not apply',
  'request.stale': 'Needs redoing',
};

/**
 * `Tag` has neutral and info only. Info marks the two that need the reader to
 * do something; everything else is a record of a decision already made.
 */
const KIND_TONE: Record<NotificationKind, 'neutral' | 'info'> = {
  'approval.needed': 'info',
  'request.stale': 'info',
  'request.approved': 'neutral',
  'request.rejected': 'neutral',
  'request.failed': 'neutral',
};

function NotificationCard({
  notification,
  onOpen,
  onMarkRead,
  marking,
}: {
  readonly notification: NotificationRow;
  readonly onOpen: () => void;
  readonly onMarkRead: () => void;
  readonly marking: boolean;
}) {
  const unread = notification.readAt === null;

  return (
    <div
      className={`rounded-blade border p-4 ${
        unread ? 'border-ink bg-white shadow-drop-sm' : 'border-line bg-paper-2'
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Tag size="sm" tone={KIND_TONE[notification.kind]}>
              {KIND_LABEL[notification.kind]}
            </Tag>
            <Show when={unread}>
              <span className="text-xs font-extrabold text-sky-on">New</span>
            </Show>
          </div>
          <p className={`text-sm ${unread ? 'font-extrabold text-ink' : 'text-ink-2'}`}>
            {notification.title}
          </p>
          <Show when={notification.body !== null}>
            <p className="mt-1 text-sm text-ink-3">{notification.body}</p>
          </Show>
          <p className="mt-1 text-xs text-ink-4">{formatDate(notification.createdAt)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Show when={notification.workflowId !== null}>
          <Button size="sm" variant="secondary" onClick={onOpen}>
            Open request
          </Button>
        </Show>
        <Show when={unread}>
          <Button size="sm" variant="tertiary" loading={marking} onClick={onMarkRead}>
            Mark read
          </Button>
        </Show>
      </div>
    </div>
  );
}

export default function AdminNotificationsScreen() {
  const navigate = useNavigate();
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data, isLoading } = useNotifications({ ...(unreadOnly && { unreadOnly: true }) });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <ConsoleShell
      active="notifications"
      title="Notifications"
      actions={
        <Show when={unreadCount > 0}>
          <Button
            size="sm"
            variant="secondary"
            loading={markAllRead.isPending}
            onClick={() => {
              markAllRead.mutate();
            }}
          >
            Mark all read
          </Button>
        </Show>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <p className="text-sm text-ink-2">
          <Show when={unreadCount > 0} fallback={<span>Nothing unread.</span>}>
            <span className="font-extrabold text-ink">{unreadCount}</span> unread
          </Show>
        </p>
        <Button
          size="sm"
          variant={unreadOnly ? 'primary' : 'secondary'}
          onClick={() => {
            setUnreadOnly((previous) => !previous);
          }}
        >
          {unreadOnly ? 'Showing unread' : 'Only unread'}
        </Button>
      </div>

      <Show when={isLoading}>
        <p className="text-sm text-ink-3">Loading…</p>
      </Show>

      <Show when={!isLoading && notifications.length === 0}>
        <div className="rounded-blade border border-line bg-white p-6 text-center">
          <p className="text-sm text-ink-2">
            {unreadOnly ? 'Nothing unread.' : 'Nothing here yet.'}
          </p>
          <p className="mt-1 text-xs text-ink-3">
            Requests waiting on you always show in Approvals, whether or not they reached
            this page.
          </p>
        </div>
      </Show>

      <div className="flex flex-col gap-3">
        {notifications.slice().map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            marking={markRead.isPending}
            onOpen={() => {
              // Opening is also reading it: a notification you have acted on
              // should not keep its badge.
              if (notification.readAt === null) markRead.mutate(notification.id);
              if (notification.workflowId !== null) {
                void navigate({ to: ROUTES.ADMIN_WORKFLOW(notification.workflowId) });
              }
            }}
            onMarkRead={() => {
              markRead.mutate(notification.id);
            }}
          />
        ))}
      </div>
    </ConsoleShell>
  );
}
