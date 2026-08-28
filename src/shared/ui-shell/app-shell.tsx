import type { ReactNode } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { useMarket } from '@features/market/hooks/use-market';
import { useStockDashboard } from '@features/stock/hooks/use-stock';
import { useSession, useSignOut } from '@features/auth';
import { KoboyoIcon } from '@icons';
import { ROUTES } from '@shared/constants/routes';
import { DESKTOP_QUERY, useMediaQuery } from '@shared/hooks/use-media-query';
import { cn } from '@shared/utils/cn';
import { AppBar, Sidebar, TabBar, type SidebarGroup, type TabBarItem } from '@ui/navigation';
import { Avatar } from '@ui/structure';

/** Where each nav entry actually goes. Ids match the design's nav. */
const DESTINATIONS: Record<string, string> = {
  kitchen: ROUTES.KITCHEN,
  stock: ROUTES.STOCK,
  saved: ROUTES.FAVOURITES,
  market: ROUTES.MARKET,
  week: ROUTES.WEEK,
  you: ROUTES.SETTINGS,
  ai: ROUTES.CHAT,
};

/**
 * Live counts on the navigation.
 *
 * The market badge is the one that matters: a list you cannot see from
 * elsewhere is a list you forget on the way to the market. The stock badge
 * flags what needs attention — low or turning — rather than the total, which
 * would just be a number nobody acts on.
 */
function useNavCounts(): { market: number; attention: number } {
  const market = useMarket();
  const dashboard = useStockDashboard();

  const pending = (market.data?.items ?? []).filter((item) => !item.bought).length;
  const counts = dashboard.data?.counts;

  return {
    market: pending,
    attention: (counts?.running_low ?? 0) + (counts?.use_soon ?? 0),
  };
}

function buildPhoneNav(counts: { market: number; attention: number }): TabBarItem[] {
  return [
    { id: 'kitchen', label: 'Kitchen', icon: 'hob', ...(counts.attention > 0 && { count: counts.attention }) },
    { id: 'saved', label: 'Saved', icon: 'bookmark' },
    { id: 'market', label: 'Market', icon: 'shoppingBasket', ...(counts.market > 0 && { count: counts.market }) },
    { id: 'ai', label: 'Ask', icon: 'robotForAi' },
    { id: 'you', label: 'You', icon: 'user' },
  ];
}

function buildDesktopNav(counts: { market: number; attention: number }): SidebarGroup[] {
  return [
    {
      items: [
        { id: 'kitchen', label: 'Kitchen', icon: 'hob' },
        { id: 'stock', label: 'Stock', icon: 'shelf', ...(counts.attention > 0 && { count: counts.attention }) },
        { id: 'market', label: 'Market list', icon: 'shoppingBasket', ...(counts.market > 0 && { count: counts.market }) },
        { id: 'ai', label: 'Ask AI', icon: 'robotForAi' },
        { id: 'saved', label: 'Saved', icon: 'bookmark' },
        { id: 'week', label: 'Your week', icon: 'chartBarBig' },
        { id: 'you', label: 'Settings', icon: 'settings' },
      ],
    },
  ];
}

interface AppShellProps {
  readonly title: string;
  /** Which nav entry is current. */
  readonly active: string;
  readonly children: ReactNode;
  /** Rendered in the app bar / beside the desktop title. */
  readonly actions?: ReactNode;
  /** A pinned bottom bar on phone — sits ABOVE the tab bar. */
  readonly dock?: ReactNode;
  readonly onBack?: () => void;
  readonly backLabel?: string;
  readonly maxWidth?: string;
  /**
   * An INNER page — a step in a flow, a detail view — rather than a
   * destination.
   *
   * Hides the phone tab bar. A flow that shows the tab bar invites somebody to
   * leave halfway through and lose what they were entering, and the bar steals
   * thumb room from the flow's own action.
   *
   * PHONE ONLY. The desktop sidebar stays on every screen — there is room for
   * it, and a desktop app that drops its navigation mid-flow feels broken
   * rather than focused.
   */
  readonly inner?: boolean;
}

/**
 * The frame every signed-in screen sits in.
 *
 * It exists because the sidebar was on the kitchen dashboard and nowhere else —
 * every other desktop screen simply had no navigation. One shell means a screen
 * cannot be built without it.
 *
 * **The tab bar is FIXED to the viewport bottom**, not placed at the end of a
 * flex column. In flow it lands wherever the content ends, which is why it
 * floated up the page on short screens. Fixed, plus bottom padding on the
 * scroll area so the last row is never hidden underneath it.
 */
export function AppShell({
  title,
  active,
  children,
  actions,
  dock,
  onBack,
  backLabel,
  maxWidth = 'max-w-[1100px]',
  inner = false,
}: AppShellProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const navigate = useNavigate();
  const signOut = useSignOut();
  const { user } = useSession();
  const counts = useNavCounts();

  const goTo = (id: string): void => {
    const destination = DESTINATIONS[id];
    if (destination !== undefined) void navigate({ to: destination });
  };

  if (isDesktop) {
    return (
      <div className="flex min-h-dvh bg-ground">
        {/* `data-tour` marks the things the product tour points AT. It is a
            hook for coach marks, nothing else — no styling hangs off it. */}
        <div data-tour="nav" className="flex shrink-0">
        <Sidebar
          groups={buildDesktopNav(counts)}
          value={active}
          onValueChange={goTo}
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
                  onClick={signOut}
                  className="text-xs text-ink-3 underline-offset-2 hover:underline"
                >
                  Sign out
                </button>
              </div>
            </div>
          }
        />
        </div>

        <main className="flex-1 overflow-x-hidden px-8 py-8">
          <div className={`mx-auto w-full ${maxWidth}`}>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                {/* Desktop had NO back control at all — the browser button was
                    the only way out of a flow, which is not something to make
                    somebody guess. */}
                <Show when={onBack !== undefined}>
                  <button
                    type="button"
                    onClick={onBack}
                    className="flex shrink-0 items-center gap-1.5 rounded-blade-xs border border-line bg-white px-3 py-2 text-sm font-extrabold text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]"
                  >
                    <KoboyoIcon name="arrowRight" size={15} className="rotate-180" alone />
                    {backLabel ?? 'Back'}
                  </button>
                </Show>
                <h1 className="min-w-0 truncate font-display text-3xl font-extrabold tracking-display">
                  {title}
                </h1>
              </div>
              <Show when={actions !== undefined}>{actions}</Show>
            </div>
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-ground">
      <AppShellPhoneBar title={title} actions={actions} onBack={onBack} backLabel={backLabel} />

      {/* Padding, not margin: the fixed bars overlay this, and without room the
          last row of content sits underneath them. */}
      <div
        className={cn(
          'px-5 pt-4',
          // Room for whichever fixed bars are actually present.
          dock !== undefined && inner && 'pb-[96px]',
          dock !== undefined && !inner && 'pb-[168px]',
          dock === undefined && inner && 'pb-8',
          dock === undefined && !inner && 'pb-[96px]',
        )}
      >
        {children}
      </div>

      <Show when={dock !== undefined}>
        <div
          className={cn(
            'fixed inset-x-0 z-30 border-t border-line bg-ground/95 px-5 py-3 backdrop-blur',
            // Sits on the floor when there is no tab bar beneath it.
            inner ? 'bottom-0' : 'bottom-[72px]',
          )}
        >
          {dock}
        </div>
      </Show>

      {/* Fixed to the viewport bottom — the whole point of the fix. Absent on
          an inner page, so a flow gets the whole screen. */}
      <Show when={!inner}>
        <div data-tour="nav" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ground">
          <TabBar items={buildPhoneNav(counts)} value={active} onValueChange={goTo} />
        </div>
      </Show>
    </div>
  );
}

function AppShellPhoneBar({
  title,
  actions,
  onBack,
  backLabel,
}: {
  readonly title: string;
  readonly actions?: ReactNode;
  readonly onBack?: () => void;
  readonly backLabel?: string;
}) {
  if (onBack !== undefined) {
    return <AppBar title={title} action={actions} onBack={onBack} backLabel={backLabel ?? 'Back'} />;
  }
  return <AppBar title={title} action={actions} />;
}


