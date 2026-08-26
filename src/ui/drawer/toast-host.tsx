import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Repeat } from 'meemaw';

import { cn } from '@shared/utils/cn';

import { drawerStore, type ToastEntry, type ToastPosition } from './drawer-store';
import { SwipeableToast } from './swipeable-toast';

/**
 * Mounts ONCE at the app root. Renders every toast in its zone.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/150-toast.html
 */

const ZONES: ToastPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

const ZONE_CLASS: Record<ToastPosition, string> = {
  'top-left': 'top-4 left-4 items-start',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
  'top-right': 'top-4 right-4 items-end',
  'bottom-left': 'bottom-4 left-4 items-start',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'bottom-4 right-4 items-end',
};

export function ToastHost() {
  const state = useSyncExternalStore(drawerStore.subscribe, drawerStore.getState, drawerStore.getState);

  if (typeof document === 'undefined') return null;
  if (state.toasts.length === 0) return null;

  return createPortal(
    <>
      <Repeat each={ZONES}>
        {(zone: ToastPosition) => {
          const toasts = state.toasts.filter((toast) => toast.position === zone);
          if (toasts.length === 0) return null;

          return (
            <div
              key={zone}
              // The zone itself is inert; only the toasts inside take pointers,
              // so a toast in the corner cannot block the page beneath it.
              className={cn(
                'pointer-events-none fixed z-toast flex max-w-[min(92vw,420px)] flex-col gap-2',
                ZONE_CLASS[zone],
              )}
            >
              <Repeat each={toasts as ToastEntry[]}>
                {(toast: ToastEntry) => (
                  <SwipeableToast
                    key={toast.id}
                    toast={toast}
                    onDismiss={() => drawerStore.dismissToast(toast.id)}
                  />
                )}
              </Repeat>
            </div>
          );
        }}
      </Repeat>
    </>,
    document.body,
  );
}
