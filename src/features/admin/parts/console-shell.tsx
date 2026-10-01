import type { ReactNode } from 'react';

import type { KoboyoIconName } from '@icons';

import { useNavigate } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { useStaffLogout, useStaffSession } from '../hooks/use-staff-session';
import { usePermissions } from '@shared/hooks/use-permissions';
import type { Scope } from '@shared/constants/permissions';
import { ROUTES } from '@shared/constants/routes';
import { Sidebar, type SidebarGroup } from '@ui/navigation';
import { Avatar } from '@ui/structure';

/**
 * The nav, with the scope each section needs.
 *
 * A section a person cannot use is not shown: an empty console is a clearer
 * message than nine links that all 403. `scope: null` means any staff member
 * may open it — only the dashboard qualifies, because it is where everybody
 * lands.
 */
interface NavSpec {
  readonly label?: string;
  /**
   * `icon` is the real glyph-name union, not `string`: a name that is not in
   * the icon set used to type-check and then crash the whole console at
   * render, which is exactly what `'list'` did.
   */
  readonly items: readonly { id: string; label: string; icon: KoboyoIconName; scope: Scope | null }[];
}

const CONSOLE_NAV: readonly NavSpec[] = [
  {
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', scope: null },
      { id: 'recipes', label: 'Recipes', icon: 'cookbook', scope: 'recipes:read' },
      { id: 'users', label: 'Users', icon: 'contact', scope: 'users:read' },
    ],
  },
  {
    label: 'The model',
    items: [
      { id: 'decide', label: 'Decide flow', icon: 'chartBarBig', scope: 'decide:read' },
      // Same flow by another door, so it shares the decide scope.
      { id: 'ask', label: 'Ask KinniJije', icon: 'speechBubble', scope: 'decide:read' },
      { id: 'ai', label: 'AI audit', icon: 'robotForAi', scope: 'ai:read' },
      { id: 'jobs', label: 'Jobs', icon: 'cycle', scope: 'jobs:read' },
      { id: 'emails', label: 'Email log', icon: 'envelope', scope: 'emails:read' },
      { id: 'campaigns', label: 'Automated email', icon: 'cycle', scope: 'emails:read' },
    ],
  },
  {
    label: 'Partners',
    items: [{ id: 'chowdeck', label: 'Chowdeck', icon: 'truck', scope: 'chowdeck:read' }],
  },
  {
    label: 'Organisation',
    items: [
      { id: 'staff', label: 'Staff', icon: 'contact', scope: 'staff:read' },
      { id: 'audit', label: 'Audit trail', icon: 'checklistPaper', scope: 'audit:read' },
      { id: 'scripts', label: 'Operations', icon: 'cycle', scope: 'scripts:read' },
      { id: 'settings', label: 'Settings', icon: 'settings', scope: 'settings:write' },
    ],
  },
];

const DESTINATIONS: Record<string, string> = {
  dashboard: ROUTES.ADMIN_DASHBOARD,
  decide: ROUTES.ADMIN_DECIDE,
  ask: ROUTES.ADMIN_ASK,
  recipes: ROUTES.ADMIN_RECIPES,
  users: ROUTES.ADMIN_USERS,
  ai: ROUTES.ADMIN_AI,
  jobs: ROUTES.ADMIN_JOBS,
  emails: ROUTES.ADMIN_EMAILS,
  campaigns: ROUTES.ADMIN_CAMPAIGNS,
  chowdeck: ROUTES.ADMIN_CHOWDECK,
  staff: ROUTES.ADMIN_STAFF,
  audit: ROUTES.ADMIN_AUDIT,
  scripts: ROUTES.ADMIN_SCRIPTS,
  settings: ROUTES.ADMIN_SETTINGS,
};

/**
 * The console frame.
 *
 * `.counter` resolves the whole register to operator density — smaller type,
 * tighter rows, more on screen. No component below takes a density prop; the
 * wrapper is the only place it is decided.
 */
export function ConsoleShell({
  active,
  title,
  actions,
  children,
}: {
  readonly active: string;
  readonly title: string;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
}) {
  const navigate = useNavigate();
  const logout = useStaffLogout();
  const { staff } = useStaffSession();
  const { can } = usePermissions();

  /**
   * Only the sections this person can actually open.
   *
   * A group whose every item was filtered out is dropped too, so no empty
   * heading is left behind — "The model" above nothing reads as broken.
   */
  const nav: SidebarGroup[] = CONSOLE_NAV.map((group) => ({
    ...(group.label === undefined ? {} : { label: group.label }),
    items: group.items
      .filter((item) => item.scope === null || can(item.scope))
      .map(({ id, label, icon }) => ({ id, label, icon })),
  })).filter((group) => group.items.length > 0) as SidebarGroup[];

  return (
    /**
     * Exactly the viewport tall, never taller — `h-dvh`, not `min-h-dvh`.
     *
     * With `min-h-dvh` a long page grew the whole shell and the WINDOW
     * scrolled, carrying the sidebar away with it. Pinned to the viewport, the
     * sidebar stays put (its own nav list scrolls inside it if it ever gets
     * long) and `main` below is the one thing that scrolls.
     */
    <div className="counter flex h-dvh overflow-hidden bg-paper">
      <Sidebar
        value={active}
        onValueChange={(id) => {
          const destination = DESTINATIONS[id];
          if (destination !== undefined) void navigate({ to: destination });
        }}
        groups={nav}
        header={
          <span className="inline-flex items-center gap-2">
            <img src="/favicon.svg" alt="" width={22} height={22} className="rounded-blade-xs" />
            <span className="font-display text-md font-extrabold tracking-display">
              Kinni<span className="text-sky-on">Jije</span>
            </span>
            <span className="font-mono text-xs text-ink-3">admin</span>
          </span>
        }
        footer={
          <div className="flex items-center gap-2">
            <Avatar name={staff?.email ?? 'admin'} size={26} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-extrabold text-ink">{staff?.email ?? 'admin'}</p>
              <button
                type="button"
                onClick={() => { logout.mutate(); }}
                className="text-xs text-ink-3 underline-offset-2 hover:underline"
              >
                Sign out
              </button>
            </div>
          </div>
        }
      />

      {/* The only scroll container. `min-h-0` lets it shrink to the shell's
          height instead of growing to its content; the sticky title bar now
          sticks to the top of THIS box. */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <header className="sticky top-0 z-sticky flex items-center justify-between gap-3 border-b border-line bg-white px-6 py-3">
          <h1 className="min-w-0 truncate font-display text-lg font-extrabold tracking-display">
            {title}
          </h1>
          <Show when={actions !== undefined}>
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          </Show>
        </header>
        <div className="flex-1 px-6 py-5">{children}</div>
      </main>
    </div>
  );
}
