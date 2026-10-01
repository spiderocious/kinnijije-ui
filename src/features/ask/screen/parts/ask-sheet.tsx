import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * The bottom sheet both pickers rise into.
 *
 * ONE implementation, because two sheets drift: the ingredient panel and the
 * area picker should feel identical, and a second hand-rolled copy is how one
 * of them quietly ends up with a different curve or no drag at all.
 *
 * Dismissal has three routes, and all three matter on a phone:
 *   the scrim, for a careless tap
 *   Escape, for a keyboard
 *   dragging the grab handle down, which is the one people actually reach for
 */
interface AskSheetProps {
  readonly label: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
  /** The pinned bottom row — a Continue button, usually. */
  readonly footer?: ReactNode;
}

/** Past this fraction of the sheet's height, releasing dismisses it. */
const DISMISS_RATIO = 0.3;

/** A fast flick dismisses regardless of distance, like every native sheet. */
const FLICK_VELOCITY = 0.5;

export function AskSheet({ label, onClose, children, footer }: AskSheetProps) {
  /** Live drag offset in px. Zero means resting. */
  const [offset, setOffset] = useState(0);
  const [closing, setClosing] = useState(false);

  /**
   * Drag state in refs, not state.
   *
   * A pointer handler reading `offset` from state sees the value captured at
   * the last render, which on a fast drag is always stale — the same bug that
   * made the verdict swipe dead on arrival.
   */
  const startY = useRef(0);
  const startedAt = useRef(0);
  const current = useRef(0);
  const dragging = useRef(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setClosing(true);
    // Let the exit animation finish before unmounting, or it never plays.
    setTimeout(onClose, 220);
  }, [onClose]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); };
  }, [close]);

  const onPointerDown = (event: React.PointerEvent): void => {
    dragging.current = true;
    startY.current = event.clientY;
    startedAt.current = performance.now();
    current.current = 0;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent): void => {
    if (!dragging.current) return;
    // Downward only. Dragging up must not let the sheet leave its own frame.
    const delta = Math.max(0, event.clientY - startY.current);
    current.current = delta;
    setOffset(delta);
  };

  const onPointerUp = (): void => {
    if (!dragging.current) return;
    dragging.current = false;

    const height = sheetRef.current?.offsetHeight ?? 1;
    const travelled = current.current;
    const velocity = travelled / Math.max(1, performance.now() - startedAt.current);

    if (travelled > height * DISMISS_RATIO || velocity > FLICK_VELOCITY) {
      close();
      return;
    }
    // Snap back, animated by the transition below.
    current.current = 0;
    setOffset(0);
  };

  return (
    <div
      className="fixed inset-0 z-modal flex items-end justify-center bg-scrim"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      style={{
        // The scrim fades with the sheet rather than snapping off at the end.
        opacity: closing ? 0 : 1,
        transition: 'opacity 220ms ease-out',
      }}
    >
      <div
        ref={sheetRef}
        className="flex h-[86dvh] w-full max-w-[520px] flex-col rounded-t-blade border-2 border-ink bg-white"
        style={{
          boxShadow: '0 -4px 0 var(--ink)',
          transform: closing ? 'translateY(100%)' : `translateY(${String(offset)}px)`,
          // No transition WHILE dragging — the finger is the clock, and easing
          // it makes the sheet lag behind the touch.
          transition: dragging.current ? 'none' : 'transform 220ms cubic-bezier(.32,.72,0,1)',
          animation: closing ? undefined : 'kj-slide-up 240ms cubic-bezier(.32,.72,0,1) both',
        }}
      >
        {/*
          The grab handle is the drag surface, not the whole sheet: dragging
          anywhere would fight the scrolling list inside.
        */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="flex shrink-0 cursor-grab touch-none justify-center py-3 active:cursor-grabbing"
        >
          <span aria-hidden="true" className="block h-1 w-9 rounded-pill bg-line-2" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col">{children}</div>

        {footer !== undefined && (
          <div className="shrink-0 border-t-hair border-line bg-paper px-4 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
