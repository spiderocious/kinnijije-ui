import { Show } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { Sidebar, type SidebarGroup, type TabBarItem } from '@ui/navigation';
import { Avatar } from '@ui/structure';

/**
 * The chrome every app scene sits in.
 *
 * Lives in one place so a scene cannot quietly grow its own navigation — which
 * is how the shipped app ended up with 25 hand-authored sites.
 */

export const PHONE_NAV: TabBarItem[] = [
  { id: 'kitchen', label: 'Kitchen', icon: 'basket' },
  { id: 'saved', label: 'Saved', icon: 'bookmark' },
  { id: 'market', label: 'Market', icon: 'shoppingBasket', count: 4 },
  { id: 'you', label: 'You', icon: 'user' },
];

export const DESKTOP_NAV: SidebarGroup[] = [
  {
    items: [
      { id: 'kitchen', label: 'Kitchen', icon: 'basket' },
      { id: 'stock', label: 'Stock', icon: 'shelf' },
      { id: 'market', label: 'Market list', icon: 'shoppingBasket', count: 4 },
    ],
  },
  {
    label: 'Cooking',
    items: [
      { id: 'plan', label: 'Plan', icon: 'calendarCircledDate' },
      { id: 'chat', label: 'Ask', icon: 'speechBubble' },
      { id: 'saved', label: 'Saved', icon: 'bookmark' },
    ],
  },
  {
    label: 'You',
    items: [
      { id: 'week', label: 'This week', icon: 'chartBarBig' },
      { id: 'settings', label: 'Settings', icon: 'settings' },
    ],
  },
];

/** The desktop shell every non-takeover scene sits in. */
export function DesktopShell({
  active,
  title,
  actions,
  children,
}: {
  readonly active: string;
  readonly title?: string;
  readonly actions?: React.ReactNode;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full">
      <Sidebar
        value={active}
        onValueChange={() => {}}
        groups={DESKTOP_NAV}
        header={
          <span className="inline-flex items-center gap-2">
            <KoboyoIcon name="cookingPot" size={22} className="text-sky" />
            <span className="font-display text-lg font-extrabold tracking-display">Kinnijije</span>
          </span>
        }
        footer={<Avatar name="ada@kinnijije.ng" size={28} label="Ada Obi" />}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <Show when={title !== undefined}>
          <header className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
            <h1 className="min-w-0 truncate font-display text-xl font-extrabold tracking-display">
              {title}
            </h1>
            <Show when={actions !== undefined}>
              <div className="flex shrink-0 items-center gap-2">{actions}</div>
            </Show>
          </header>
        </Show>
        <div className="flex-1 px-6 py-6">{children}</div>
      </main>
    </div>
  );
}

