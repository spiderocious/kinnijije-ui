import { Repeat } from 'meemaw';

import { KoboyoIcon, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';
import { Badge } from '@ui/status';

/**
 * The phone's primary navigation.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/181-tab-bar.html
 *
 * Three to five destinations, in the thumb zone, with the label ALWAYS visible.
 * An icon-only tab bar makes a user learn five glyphs before they can navigate,
 * and the labels cost one line of height.
 *
 * A tab bar shows DESTINATIONS, never actions — the FAB and the dock carry
 * actions. A "＋" in a tab bar is the single most common way this component
 * gets misused.
 */

/**
 * Navigation icons run LIGHTER than the default 1.2.
 *
 * A nav rail shows seven or eight marks stacked in a narrow column, and at that
 * density the default weight turns the busier icons — the stock shelf
 * especially — into dark blobs with no internal detail. 0.8 keeps every one of
 * them structured while still reading as one family.
 */
const NAV_ICON_WEIGHT = 0.8;

export interface TabBarItem {
  readonly id: string;
  readonly label: string;
  readonly icon: KoboyoIconName;
  /** An unread count on this destination. Zero shows no badge. */
  readonly count?: number;
  /**
   * Gated — signed out, typically. The tab STAYS in the bar rather than
   * disappearing: a nav that changes shape on sign-out teaches the user a
   * different map of the app than the one they will have after signing in.
   */
  readonly disabled?: boolean;
}

export interface TabBarProps {
  readonly items: readonly TabBarItem[];
  readonly value: string;
  readonly onValueChange: (id: string) => void;
  readonly className?: string;
}

export function TabBar({ items, value, onValueChange, className }: TabBarProps) {
  return (
    <nav
      aria-label="Primary"
      className={cn(
        'sticky bottom-0 z-nav flex items-stretch border-t border-ink bg-paper',
        'pb-[max(0px,env(safe-area-inset-bottom))]',
        className,
      )}
    >
      <Repeat each={[...items]}>
        {(item: TabBarItem) => {
          const active = item.id === value;
          const gated = item.disabled === true;
          return (
            <button
              key={item.id}
              type="button"
              // Lets the product tour point at ONE destination rather than the
              // whole bar. Purely an anchor — nothing styles off it.
              data-tour={`nav-${item.id}`}
              aria-current={active ? 'page' : undefined}
              disabled={gated}
              onClick={() => onValueChange(item.id)}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-[3px] py-2',
                'transition-colors duration-fast',
                'focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_3px_var(--sky-glow)]',
                gated && 'cursor-not-allowed opacity-[0.42]',
                active ? 'text-sky-on' : 'text-ink-3 hover:text-ink',
              )}
            >
              <span className="relative">
                <KoboyoIcon name={item.icon} size={22} weight={NAV_ICON_WEIGHT} />
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -right-2 -top-1">
                    <Badge count={item.count} />
                  </span>
                )}
              </span>
              {/* The label is always visible — never icon-only. */}
              <span className={cn('text-xs', active ? 'font-extrabold' : 'font-semibold')}>
                {item.label}
              </span>
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-4 top-0 h-[3px] rounded-pill bg-sky"
                />
              )}
            </button>
          );
        }}
      </Repeat>
    </nav>
  );
}
