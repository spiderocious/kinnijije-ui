import { useRef, useState } from 'react';

/**
 * Horizontal swipe, as a hook.
 *
 * Pointer events rather than touch events, matching `swipeable-toast.tsx`: one
 * code path covers finger, trackpad and mouse, and pointer capture means a drag
 * that leaves the element still finishes properly instead of sticking.
 *
 * The travelled distance is held in a REF as well as in state. State drives the
 * render; the ref is what `onPointerUp` reads. Reading `offset` from state
 * there closes over the value from the render the handler was created in, which
 * is 0 on the first drag of a slide — so the threshold was never met and the
 * swipe silently did nothing.
 */

/**
 * How far before it counts as a swipe rather than a tap.
 *
 * A fraction of the element's own width rather than a fixed pixel count, so the
 * gesture feels the same on a small phone and a tablet.
 */
const THRESHOLD_RATIO = 0.18;

/** Used until the element has been measured. */
const FALLBACK_THRESHOLD_PX = 48;

/**
 * Past this much vertical travel it is a SCROLL, not a swipe.
 *
 * Generous, because the slides scroll vertically too: a finger that starts
 * moving down is reading the card, not changing it.
 */
const VERTICAL_TOLERANCE_PX = 30;

export interface SwipeHandlers {
  /** Pixels dragged, signed. Negative is "towards the next slide". */
  readonly offset: number;
  readonly dragging: boolean;
  readonly bind: {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerCancel: (e: React.PointerEvent<HTMLElement>) => void;
  };
}

export function useSwipe(options: {
  onNext: () => void;
  onPrevious: () => void;
  /** False at the ends, so the card resists instead of promising a move. */
  canGoNext: boolean;
  canGoPrevious: boolean;
}): SwipeHandlers {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const start = useRef<{ x: number; y: number } | null>(null);
  /** The live travelled distance, readable from any handler without a re-render. */
  const travelled = useRef(0);
  /** The viewport's own width, so the threshold scales with it. */
  const width = useRef(0);
  /** True once the gesture has committed to horizontal. */
  const horizontal = useRef(false);

  const reset = () => {
    start.current = null;
    travelled.current = 0;
    horizontal.current = false;
    setDragging(false);
    setOffset(0);
  };

  const move = (next: number) => {
    travelled.current = next;
    setOffset(next);
  };

  return {
    offset,
    dragging,
    bind: {
      onPointerDown: (e) => {
        start.current = { x: e.clientX, y: e.clientY };
        travelled.current = 0;
        horizontal.current = false;
        width.current = e.currentTarget.clientWidth;
        setDragging(true);
        // Capture so the drag survives the pointer leaving the element, and so
        // a child that scrolls cannot swallow the rest of the gesture.
        e.currentTarget.setPointerCapture(e.pointerId);
      },

      onPointerMove: (e) => {
        if (start.current === null) return;

        const dx = e.clientX - start.current.x;
        const dy = e.clientY - start.current.y;

        // Decide ONCE which way this gesture is going, then stay with it.
        // Re-deciding every frame means a slightly diagonal drag flickers
        // between scrolling and swiping and does neither well.
        if (!horizontal.current) {
          if (Math.abs(dy) > VERTICAL_TOLERANCE_PX && Math.abs(dy) > Math.abs(dx)) {
            // Vertical intent: let the slide scroll, abandon the swipe.
            reset();
            return;
          }
          if (Math.abs(dx) < 8) return;
          horizontal.current = true;
        }

        // Rubber-band at the ends rather than refusing to move: a rigid card
        // reads as broken, one that gives a little reads as "nothing that way".
        const blocked = (dx < 0 && !options.canGoNext) || (dx > 0 && !options.canGoPrevious);
        if (blocked) {
          move(dx * 0.25);
          return;
        }

        // Never drag further than one slide, or the next card would already be
        // gone before the finger lifted.
        const max = width.current > 0 ? width.current : Infinity;
        move(Math.max(-max, Math.min(max, dx)));
      },

      onPointerUp: () => {
        if (start.current === null) return;

        // From the REF, not from state: see the note at the top of this file.
        const distance = travelled.current;
        const threshold =
          width.current > 0 ? width.current * THRESHOLD_RATIO : FALLBACK_THRESHOLD_PX;

        reset();

        if (distance <= -threshold && options.canGoNext) options.onNext();
        else if (distance >= threshold && options.canGoPrevious) options.onPrevious();
      },

      onPointerCancel: reset,
    },
  };
}
