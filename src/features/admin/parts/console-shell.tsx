import { useEffect, useState, type ReactNode } from 'react';

import { KoboyoIcon, Menu, type KoboyoIconName } from '@icons';

import { useNavigate } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { useStaffLogout, useStaffSession } from '../hooks/use-staff-session';
import { useUnreadCount } from '../hooks/use-workflows';
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
      // Sits with the model group because it is the layer AHEAD of the
      // ranker: a curated rule decides the shortlist, the model still writes.
      { id: 'matching', label: 'Matching studio', icon: 'target', scope: 'matching:read' },
      // Read-only observability: is the planner used, and does it give people
      // something usable. Its own scope so usage can be watched without
      // handing out `users:read`.
      { id: 'timetables', label: 'Timetables', icon: 'calendarCircledDate', scope: 'timetables:read' },
      /*
       * Dishes the composing planner invented. `recipes:read`, not
       * `timetables:read` — promoting one writes a draft to the catalogue,
       * so it belongs to whoever owns recipes.
       */
      { id: 'suggestions', label: 'Suggestions', icon: 'cookbook', scope: 'recipes:read' },
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
      /**
       * Approvals sits above Staff because it is a working queue rather than a
       * reference screen. `workflows:read` is granted to anyone who can
       * request a change, so a requester can watch their own request — which
       * was point 3 of the brief.
       */
      { id: 'workflows', label: 'Approvals', icon: 'checklistPaper', scope: 'workflows:read' },
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
  matching: ROUTES.ADMIN_MATCHING,
  timetables: ROUTES.ADMIN_TIMETABLES,
  suggestions: ROUTES.ADMIN_SUGGESTIONS,
  workflows: ROUTES.ADMIN_WORKFLOWS,
  notifications: ROUTES.ADMIN_NOTIFICATIONS,
  staff: ROUTES.ADMIN_STAFF,
  audit: ROUTES.ADMIN_AUDIT,
  scripts: ROUTES.ADMIN_SCRIPTS,
  settings: ROUTES.ADMIN_SETTINGS,
};

/**
 * The bell, with its unread count.
 *
 * Lives in the shell rather than on each screen because "something needs you"
 * has to be visible from wherever somebody happens to be. The count polls on a
 * slow interval — see `useUnreadCount`; a minute-stale integer is harmless and
 * a websocket for it would be a lot of moving parts to keep alive.
 *
 * No scope gate: every notification is addressed to the person reading it, so
 * anybody who can reach the console has a bell worth checking.
 */
function NotificationBell({ active }: { readonly active: string }) {
  const navigate = useNavigate();
  const { data } = useUnreadCount();
  const unread = data?.unreadCount ?? 0;

  return (
    <button
      type="button"
      aria-label={unread === 0 ? 'Notifications' : `Notifications, ${String(unread)} unread`}
      onClick={() => {
        void navigate({ to: ROUTES.ADMIN_NOTIFICATIONS });
      }}
      className={`relative inline-flex h-8 w-8 items-center justify-center rounded-blade-xs border transition-colors ${
        active === 'notifications'
          ? 'border-ink bg-sky-100'
          : 'border-line bg-white hover:border-ink'
      }`}
    >
      <KoboyoIcon name="bellNotification" size={16} alone />
      <Show when={unread > 0}>
        <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-4 items-center justify-center rounded-full border border-ink bg-sky px-1 font-mono text-[10px] font-extrabold leading-4 text-white">
          {unread > 9 ? '9+' : unread}
        </span>
      </Show>
    </button>
  );
}

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
   * The nav drawer, on phones only.
   *
   * The console is a 232px rail plus content, which on a 390px screen leaves
   * 158px for the work — unusable. Under `lg` the rail becomes a drawer behind
   * a hamburger, and the SAME `Sidebar` renders in both, so there is one nav
   * to keep correct rather than two.
   */
  const [navOpen, setNavOpen] = useState(false);

  /**
   * Escape closes it, and the page behind does not scroll while it is open.
   *
   * Both are what makes a drawer feel like a drawer rather than a panel that
   * happens to be on top — scrolling the page under an open overlay is the
   * thing that reads most obviously as broken.
   */
  useEffect(() => {
    if (!navOpen) return;

    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setNavOpen(false);
    };

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [navOpen]);

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
      {/*
       * The scrim. Only under `lg`, and only while the drawer is open — it is
       * what makes tapping away close the nav, which is the gesture people
       * reach for before they look for a close button.
       */}
      <Show when={navOpen}>
        <button
          type="button"
          aria-label="Close the menu"
          onClick={() => {
            setNavOpen(false);
          }}
          className="fixed inset-0 z-modal bg-scrim lg:hidden"
        />
      </Show>

      <Sidebar
        value={active}
        onValueChange={(id) => {
          // Closing on navigate is what stops the drawer covering the screen
          // somebody just asked to see.
          setNavOpen(false);
          const destination = DESTINATIONS[id];
          if (destination !== undefined) void navigate({ to: destination });
        }}
        groups={nav}
        /*
         * One component, two layouts. On `lg` it is the static rail it has
         * always been; below that it is a fixed drawer that slides in from
         * the left. Rendering a second mobile nav would mean two lists of
         * destinations to keep in step, and they would drift.
         */
        className={`fixed inset-y-0 left-0 z-modal transition-transform duration-base lg:static lg:z-auto lg:translate-x-0 lg:transition-none ${
          navOpen ? 'translate-x-0 shadow-drop' : '-translate-x-full'
        }`}
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
        <header className="sticky top-0 z-sticky flex items-center gap-2 border-b border-line bg-white px-4 py-3 sm:gap-3 sm:px-6">
          {/* The drawer toggle. Gone on `lg`, where the rail is always there. */}
          <button
            type="button"
            onClick={() => {
              setNavOpen(true);
            }}
            aria-label="Open the menu"
            aria-expanded={navOpen}
            className="-ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-blade-xs text-ink-2 hover:bg-paper-2 hover:text-ink lg:hidden"
          >
            <Menu size={19} strokeWidth={2.2} />
          </button>

          <h1 className="min-w-0 flex-1 truncate font-display text-md font-extrabold tracking-display sm:text-lg">
            {title}
          </h1>

          <div className="flex shrink-0 items-center gap-2">
            <NotificationBell active={active} />
          </div>
        </header>

        {/*
         * Actions sit on their own row, not in the title bar.
         *
         * They can be wide — filters, a search field, a primary button — and
         * on a phone they squeezed the title to nothing. Their own row wraps
         * cleanly at any width.
         *
         * RENDERED ONCE, deliberately. The obvious version renders them in
         * the header for desktop and again here for mobile with `hidden`
         * classes, which mounts every action twice: two copies of a search
         * input with the same id, two pieces of state, and a filter that
         * updates in one copy and not the other.
         */}
        <Show when={actions !== undefined}>
          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-white px-4 py-2.5 sm:px-6 lg:justify-end">
            {actions}
          </div>
        </Show>

        <div className="flex-1 px-4 py-4 sm:px-6 sm:py-5">{children}</div>
      </main>
    </div>
  );
}
