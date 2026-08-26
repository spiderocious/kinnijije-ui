import { useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@shared/utils/cn';

/**
 * The hover label, with the ceiling on what may go in it.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/161-tooltip.html
 *
 * **ONE short line explaining a control.** If it needs two sentences it is a
 * Popover; if it needs an action it is definitely a Popover, because a tooltip
 * cannot be reached by keyboard reliably.
 *
 * `content` is typed as `string` rather than `ReactNode` precisely so a button
 * or a link cannot be put inside one.
 *
 * Portals to the body — it must escape any `overflow: hidden` ancestor, which
 * is the single most common reason a tooltip renders clipped or invisible.
 */

const HOVER_DELAY_MS = 400;

const sideOffset = 8;

export interface TooltipProps {
  /** ONE line. A string, so an action cannot be smuggled in. */
  readonly content: string;
  readonly side?: 'top' | 'right' | 'bottom' | 'left';
  readonly children: ReactNode;
}

export function Tooltip({ content, side = 'top', children }: TooltipProps) {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const timer = useRef<number | null>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);

  function show() {
    if (content === '') return;
    timer.current = window.setTimeout(() => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (rect === undefined) return;

      const positions = {
        top: { top: rect.top - sideOffset, left: rect.left + rect.width / 2 },
        bottom: { top: rect.bottom + sideOffset, left: rect.left + rect.width / 2 },
        left: { top: rect.top + rect.height / 2, left: rect.left - sideOffset },
        right: { top: rect.top + rect.height / 2, left: rect.right + sideOffset },
      };
      setCoords(positions[side]);
    }, HOVER_DELAY_MS);
  }

  function hide() {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    // Exit is immediate on leave — a lingering tooltip blocks what is under it.
    setCoords(null);
  }

  const translate = {
    top: '-50%, -100%',
    bottom: '-50%, 0',
    left: '-100%, -50%',
    right: '0, -50%',
  }[side];

  return (
    <>
      <span
        ref={anchorRef}
        onPointerEnter={show}
        onPointerLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="inline-flex"
      >
        {children}
      </span>

      {coords !== null &&
        typeof document !== 'undefined' &&
        createPortal(
          <span
            role="tooltip"
            className={cn(
              'pointer-events-none fixed z-tooltip max-w-[280px] rounded-blade-xs',
              'bg-ink px-3 py-[6px] text-xs font-semibold text-ink-inv shadow-pop animate-fade',
            )}
            style={{ top: coords.top, left: coords.left, transform: `translate(${translate})` }}
          >
            {content}
          </span>,
          document.body,
        )}
    </>
  );
}
