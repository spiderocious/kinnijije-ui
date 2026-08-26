import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Repeat, Show } from 'meemaw';

import { KoboyoIcon, X, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';

import { drawerStore, type BannerEntry, type FeedbackTone } from './drawer-store';

/**
 * Mounts ONCE at the app root. Renders the top and bottom banner strips.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/149-banner-system.html
 *                                                          174-offline-banner.html
 *
 * A banner is for a state that persists — offline, a paused feature, a degraded
 * service. A toast is for something that just happened. Using a toast for a
 * persistent state means the user misses it if they look away for four seconds.
 */

const TONE_CLASS: Record<FeedbackTone, string> = {
  neutral: 'bg-neutral-soft text-neutral-onsoft border-neutral-border',
  info: 'bg-info-soft text-info-onsoft border-info-border',
  success: 'bg-success-soft text-success-onsoft border-success-border',
  caution: 'bg-caution-soft text-caution-onsoft border-caution-border',
  critical: 'bg-critical-soft text-critical-onsoft border-critical-border',
  ai: 'bg-grape-soft text-grape-onsoft border-grape-border',
};

const TONE_ICON: Record<FeedbackTone, KoboyoIconName> = {
  neutral: 'info',
  info: 'info',
  success: 'tick',
  caution: 'solidWarning',
  critical: 'error',
  ai: 'robotForAi',
};

function BannerStrip({ banner }: { readonly banner: BannerEntry }) {
  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex items-center gap-3 border-b px-4 py-3',
        banner.position === 'bottom' && 'border-b-0 border-t',
        TONE_CLASS[banner.tone],
      )}
    >
      <KoboyoIcon name={TONE_ICON[banner.tone]} size={18} className="shrink-0" />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold">{banner.title}</p>
        <Show when={banner.description !== undefined}>
          <p className="text-sm opacity-90">{banner.description}</p>
        </Show>
      </div>

      <Show when={banner.cta !== undefined}>
        <button
          type="button"
          onClick={banner.cta?.onClick}
          className="shrink-0 rounded-blade-xs border border-current px-3 py-1 text-sm font-extrabold transition-opacity hover:opacity-70"
        >
          {banner.cta?.label}
        </button>
      </Show>

      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => drawerStore.dismissBanner(banner.id)}
        className="grid h-6 w-6 shrink-0 place-items-center rounded-round transition-colors hover:bg-ink/10 focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]"
      >
        <X size={14} strokeWidth={3} />
      </button>
    </div>
  );
}

export function BannerHost() {
  const state = useSyncExternalStore(drawerStore.subscribe, drawerStore.getState, drawerStore.getState);

  if (typeof document === 'undefined') return null;
  if (state.banners.length === 0) return null;

  const top = state.banners.filter((banner) => banner.position === 'top');
  const bottom = state.banners.filter((banner) => banner.position === 'bottom');

  return createPortal(
    <>
      <Show when={top.length > 0}>
        <div className="pointer-events-none fixed inset-x-0 top-0 z-nav flex flex-col">
          <Repeat each={top as BannerEntry[]}>
            {(banner: BannerEntry) => <BannerStrip key={banner.id} banner={banner} />}
          </Repeat>
        </div>
      </Show>

      <Show when={bottom.length > 0}>
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-nav flex flex-col">
          <Repeat each={bottom as BannerEntry[]}>
            {(banner: BannerEntry) => <BannerStrip key={banner.id} banner={banner} />}
          </Repeat>
        </div>
      </Show>
    </>,
    document.body,
  );
}
