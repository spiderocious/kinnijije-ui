import { Repeat, Show } from 'meemaw';

import { KoboyoIcon, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';
import { Badge } from '@ui/status';

/**
 * The desktop navigation rail.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/182-sidebar.html
 *
 * The desktop counterpart to `TabBar`. Where the tab bar is capped at five
 * destinations because a thumb cannot reach more, a sidebar can group — so it
 * carries the sections a phone has to bury in a menu.
 *
 * Like the tab bar, it shows **destinations, never actions**.
 */

export interface SidebarItem {
  readonly id: string;
  readonly label: string;
  readonly icon: KoboyoIconName;
  /**
   * A count beside the destination. `undefined` means still resolving and
   * renders a small shimmer; `0` means resolved-and-empty and renders nothing.
   * The two are different answers and must not collapse into one.
   */
  readonly count?: number;
  /** Explicitly marks the count as still loading, when 0 is a real value. */
  readonly countLoading?: boolean;
}

export interface SidebarGroup {
  /** Omit for the first, ungrouped run of items. */
  readonly label?: string;
  readonly items: readonly SidebarItem[];
}

export interface SidebarProps {
  readonly groups: readonly SidebarGroup[];
  readonly value: string;
  readonly onValueChange: (id: string) => void;
  /** The wordmark or a brand slot at the top. */
  readonly header?: React.ReactNode;
  /** An account row pinned to the bottom. */
  readonly footer?: React.ReactNode;
  readonly className?: string;
}

export function Sidebar({
  groups,
  value,
  onValueChange,
  header,
  footer,
  className,
}: SidebarProps) {
  return (
    <nav
      aria-label="Primary"
      className={cn(
        'flex w-[232px] shrink-0 flex-col border-r border-line bg-white',
        className,
      )}
    >
      <Show when={header !== undefined}>
        <div className="border-b border-line px-4 py-4">{header}</div>
      </Show>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <Repeat each={[...groups]}>
          {(group: SidebarGroup, index: number) => (
            <div key={group.label ?? index} className="mb-5 last:mb-0">
              <Show when={group.label !== undefined}>
                <p className="mb-2 px-2 text-xs font-extrabold uppercase tracking-overline text-ink-3">
                  {group.label}
                </p>
              </Show>

              {/* A section with nothing in it still shows, greyed. Removing it
                  would change the shape of the nav between two users of the
                  same product, so nobody could be told where anything lives. */}
              <Show when={group.items.length === 0}>
                <p className="px-2 py-1.5 text-sm text-ink-4">Nothing here yet</p>
              </Show>

              <ul className="flex flex-col gap-[2px]">
                <Repeat each={[...group.items]}>
                  {(item: SidebarItem) => {
                    const active = item.id === value;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          // Anchor for the product tour — see TabBar.
                          data-tour={`nav-${item.id}`}
                          aria-current={active ? 'page' : undefined}
                          onClick={() => onValueChange(item.id)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-blade-xs px-3 py-[9px] text-left text-ctrl',
                            'transition-colors duration-fast',
                            'focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]',
                            active
                              ? 'bg-sky font-extrabold text-sky-onbase'
                              : 'font-semibold text-ink-2 hover:bg-paper-2 hover:text-ink',
                          )}
                        >
                          <KoboyoIcon name={item.icon} size={18} className="shrink-0" />
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          {/* Counts resolving — the badge's space is held so the
                              labels do not shift when the numbers land. */}
                          <Show when={item.countLoading === true}>
                            <span
                              aria-hidden="true"
                              className="block h-[18px] w-6 animate-shimmer rounded-pill bg-paper-2"
                            />
                          </Show>
                          <Show
                            when={
                              item.countLoading !== true &&
                              item.count !== undefined &&
                              item.count > 0
                            }
                          >
                            <Badge count={item.count ?? 0} />
                          </Show>
                        </button>
                      </li>
                    );
                  }}
                </Repeat>
              </ul>
            </div>
          )}
        </Repeat>
      </div>

      <Show when={footer !== undefined}>
        <div className="border-t border-line px-4 py-3">{footer}</div>
      </Show>
    </nav>
  );
}
