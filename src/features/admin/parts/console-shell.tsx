import type { ReactNode } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { useSession, useSignOut } from '@features/auth';
import { KoboyoIcon } from '@icons';
import { ROUTES } from '@shared/constants/routes';
import { Sidebar, type SidebarGroup } from '@ui/navigation';
import { Avatar } from '@ui/structure';

const CONSOLE_NAV: SidebarGroup[] = [
  {
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
      { id: 'recipes', label: 'Recipes', icon: 'cookbook' },
      { id: 'users', label: 'Users', icon: 'contact' },
    ],
  },
  {
    label: 'The model',
    items: [
      { id: 'ai', label: 'AI audit', icon: 'robotForAi' },
      { id: 'jobs', label: 'Jobs', icon: 'cycle' },
    ],
  },
];

const DESTINATIONS: Record<string, string> = {
  dashboard: ROUTES.ADMIN_DASHBOARD,
  recipes: ROUTES.ADMIN_RECIPES,
  users: ROUTES.ADMIN_USERS,
  ai: ROUTES.ADMIN_AI,
  jobs: ROUTES.ADMIN_JOBS,
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
  const signOut = useSignOut();
  const { user } = useSession();

  return (
    <div className="counter flex min-h-dvh bg-paper">
      <Sidebar
        value={active}
        onValueChange={(id) => {
          const destination = DESTINATIONS[id];
          if (destination !== undefined) void navigate({ to: destination });
        }}
        groups={CONSOLE_NAV}
        header={
          <span className="inline-flex items-center gap-2">
            <KoboyoIcon name="cookingPot" size={20} className="text-sky" />
            <span className="font-display text-md font-extrabold tracking-display">Kinnijije</span>
            <span className="font-mono text-xs text-ink-3">admin</span>
          </span>
        }
        footer={
          <div className="flex items-center gap-2">
            <Avatar name={user?.email ?? 'admin'} size={26} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-extrabold text-ink">{user?.email ?? 'admin'}</p>
              <button
                type="button"
                onClick={signOut}
                className="text-xs text-ink-3 underline-offset-2 hover:underline"
              >
                Sign out
              </button>
            </div>
          </div>
        }
      />

      <main className="flex min-w-0 flex-1 flex-col">
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
