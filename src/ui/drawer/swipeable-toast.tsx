import { useRef, useState } from 'react';

import { KoboyoIcon, X, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';

import type { FeedbackTone, ToastEntry } from './drawer-store';

/**
 * One toast. Swipe horizontally to dismiss — unless it is sticky, in which case
 * it can only be dismissed by its own control.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/150-toast.html
 */

const TONE_CLASS: Record<FeedbackTone, string> = {
  neutral: 'bg-white text-ink border-ink',
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

/** Past this many pixels the toast leaves rather than springing back. */
const DISMISS_THRESHOLD_PX = 72;

export interface SwipeableToastProps {
  readonly toast: ToastEntry;
  readonly onDismiss: () => void;
}

export function SwipeableToast({ toast, onDismiss }: SwipeableToastProps) {
  const [offset, setOffset] = useState(0);
  const startX = useRef<number | null>(null);

  const swipeable = !toast.sticky;

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!swipeable) return;
    startX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (startX.current === null) return;
    setOffset(event.clientX - startX.current);
  }

  function handlePointerUp() {
    if (startX.current === null) return;
    startX.current = null;
    if (Math.abs(offset) > DISMISS_THRESHOLD_PX) onDismiss();
    else setOffset(0);
  }

  return (
    <div
      role="status"
      aria-live={toast.tone === 'critical' ? 'assertive' : 'polite'}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={cn(
        'pointer-events-auto flex items-center gap-3 rounded-blade border-bold px-4 py-3 shadow-drop',
        'animate-serve',
        swipeable && 'cursor-grab touch-pan-y active:cursor-grabbing',
        TONE_CLASS[toast.tone],
      )}
      style={{
        transform: `translateX(${offset}px)`,
        opacity: 1 - Math.min(0.7, Math.abs(offset) / 240),
        transition: startX.current === null ? 'transform 180ms var(--ease-out), opacity 180ms' : 'none',
      }}
    >
      <KoboyoIcon name={TONE_ICON[toast.tone]} size={17} className="shrink-0" />

      <span className="min-w-0 flex-1 text-sm font-semibold">{toast.message}</span>

      {toast.action !== undefined && (
        <button
          type="button"
          onClick={toast.action.onClick}
          className="shrink-0 text-sm font-extrabold underline decoration-2 underline-offset-2 hover:opacity-70"
        >
          {toast.action.label}
        </button>
      )}

      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="grid h-5 w-5 shrink-0 place-items-center rounded-round transition-colors hover:bg-ink/10 focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]"
      >
        <X size={13} strokeWidth={3} />
      </button>
    </div>
  );
}
