import { useSession } from '@features/auth';
import { KoboyoIcon } from '@icons';
import { Sidebar, type SidebarGroup } from '@ui/navigation';
import { Avatar } from '@ui/structure';

interface KitchenSidebarProps {
  readonly items: readonly SidebarGroup[];
  readonly active: string;
  readonly onSignOut: () => void;
}

/**
 * The desktop rail.
 *
 * Only Kitchen is reachable today, so the other entries do not navigate —
 * `onValueChange` is a no-op rather than a route that 404s.
 */
export function KitchenSidebar({ items, active, onSignOut }: KitchenSidebarProps) {
  const { user } = useSession();

  return (
    <Sidebar
      groups={items}
      value={active}
      onValueChange={() => undefined}
      header={
        <div className="flex items-center gap-2 px-1">
          <KoboyoIcon name="cookingPot" size={26} className="text-sky" alone />
          <span className="font-display text-lg font-extrabold tracking-display">Kinnijije</span>
        </div>
      }
      footer={
        <div className="flex items-center gap-3">
          <Avatar name={user?.email ?? 'you'} size={32} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold text-ink">{user?.name ?? 'You'}</p>
            <button
              type="button"
              onClick={onSignOut}
              className="text-xs text-ink-3 underline-offset-2 hover:underline"
            >
              Sign out
            </button>
          </div>
        </div>
      }
    />
  );
}
