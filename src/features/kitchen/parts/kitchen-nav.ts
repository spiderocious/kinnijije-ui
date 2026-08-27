import type { TabBarItem } from '@ui/navigation';
import type { SidebarGroup } from '@ui/navigation';

/**
 * The app's navigation, lifted from the scenes.
 *
 * Counts are omitted deliberately: the market list does not exist yet, and a
 * badge showing "4" when there is nothing behind it is a lie the UI tells on
 * every screen.
 */
export const PHONE_NAV: TabBarItem[] = [
  { id: 'kitchen', label: 'Kitchen', icon: 'basket' },
  { id: 'saved', label: 'Saved', icon: 'bookmark' },
  { id: 'market', label: 'Market', icon: 'shoppingBasket' },
  { id: 'you', label: 'You', icon: 'user' },
];

export const DESKTOP_NAV: SidebarGroup[] = [
  {
    items: [
      { id: 'kitchen', label: 'Kitchen', icon: 'basket' },
      { id: 'saved', label: 'Saved', icon: 'bookmark' },
      { id: 'market', label: 'Market list', icon: 'shoppingBasket' },
    ],
  },
];
