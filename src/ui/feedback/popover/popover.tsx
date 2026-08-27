import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Show } from 'meemaw';

import { cn } from '@shared/utils/cn';

/**
 * The popover — the tooltip's big sibling.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/162-popover.html
 *                                                          166-overlay-contract.html
 *
 * Where a `Tooltip` is one line and cannot hold an action, a popover can hold
 * both — and therefore has to be reachable by keyboard, which is why it is a
 * real dialog rather than a hover surface.
 *
 * **It PORTALS.** The shipped popover did not, so it clipped inside every card
 * with `overflow: hidden` — which is most of them. That single detail is why
 * this exists as a component rather than a `<div>` with absolute positioning.
 *
 * Follows the five-part overlay contract: `open` / `onOpenChange` /
 * `defaultOpen` / `Trigger` / `Portal`.
 */

type Side = 'top' | 'right' | 'bottom' | 'left';
type Align = 'start' | 'center' | 'end';

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
  anchorRef: React.RefObject<HTMLSpanElement | null>;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopover(component: string): PopoverContextValue {
  const context = useContext(PopoverContext);
  if (context === null) throw new Error(`${component} must be rendered inside <Popover.Root>.`);
  return context;
}

export interface PopoverRootProps {
  /** Controlled. Omit for uncontrolled with `defaultOpen`. */
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly defaultOpen?: boolean;
  readonly children: ReactNode;
}

function PopoverRoot({ open, onOpenChange, defaultOpen = false, children }: PopoverRootProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const contentId = useId();
  const anchorRef = useRef<HTMLSpanElement>(null);

  const isControlled = open !== undefined;
  const value = isControlled ? open : uncontrolled;

  function setOpen(next: boolean) {
    if (!isControlled) setUncontrolled(next);
    onOpenChange?.(next);
  }

  return (
    <PopoverContext.Provider value={{ open: value, setOpen, contentId, anchorRef }}>
      <span ref={anchorRef} className="relative inline-flex">
        {children}
      </span>
    </PopoverContext.Provider>
  );
}

function PopoverTrigger({ children }: { readonly children: ReactNode }) {
  const { open, setOpen, contentId } = usePopover('Popover.Trigger');

  return (
    <span
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={open ? contentId : undefined}
      onClick={() => setOpen(!open)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setOpen(!open);
        }
      }}
      className="inline-flex cursor-pointer rounded-[3px] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]"
    >
      {children}
    </span>
  );
}

export interface PopoverContentProps {
  readonly side?: Side;
  readonly align?: Align;
  readonly title?: string;
  readonly className?: string;
  readonly children: ReactNode;
}

function PopoverContent({
  side = 'bottom',
  align = 'center',
  title,
  className,
  children,
}: PopoverContentProps) {
  const { open, setOpen, contentId, anchorRef } = usePopover('Popover.Content');
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }

    function place() {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (rect === undefined) return;
      const gap = 8;
      const positions: Record<Side, { top: number; left: number }> = {
        top: { top: rect.top - gap, left: rect.left + rect.width / 2 },
        bottom: { top: rect.bottom + gap, left: rect.left + rect.width / 2 },
        left: { top: rect.top + rect.height / 2, left: rect.left - gap },
        right: { top: rect.top + rect.height / 2, left: rect.right + gap },
      };
      setCoords(positions[side]);
    }

    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (
        contentRef.current?.contains(target) === false &&
        anchorRef.current?.contains(target) === false
      ) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, side, setOpen, anchorRef]);

  if (!open || coords === null || typeof document === 'undefined') return null;

  const translate: Record<Side, Record<Align, string>> = {
    top: { start: '0, -100%', center: '-50%, -100%', end: '-100%, -100%' },
    bottom: { start: '0, 0', center: '-50%, 0', end: '-100%, 0' },
    left: { start: '-100%, 0', center: '-100%, -50%', end: '-100%, -100%' },
    right: { start: '0, 0', center: '0, -50%', end: '0, -100%' },
  };

  // Portals to the body — the shipped one did not, so it clipped inside every
  // card with overflow:hidden.
  return createPortal(
    <div
      ref={contentRef}
      id={contentId}
      role="dialog"
      aria-label={title}
      className={cn(
        'fixed z-dropdown max-w-[320px] rounded-blade border-bold border-ink bg-white p-4 shadow-pop animate-fade',
        className,
      )}
      style={{
        top: coords.top,
        left: coords.left,
        transform: `translate(${translate[side][align]})`,
      }}
    >
      <Show when={title !== undefined}>
        <p className="mb-2 font-display text-md font-extrabold tracking-display">{title}</p>
      </Show>
      <div className="text-sm text-ink-2">{children}</div>
    </div>,
    document.body,
  );
}

export const Popover = {
  Root: PopoverRoot,
  Trigger: PopoverTrigger,
  Content: PopoverContent,
};

/**
 * A popover whose content is being fetched.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/162-popover.html
 *
 * **The panel opens immediately and fills in.** Deferring the open until the
 * content lands makes the trigger feel dead on a slow connection — the user
 * presses again, and the second press closes what the first one opened.
 */
export function PopoverLoading({ lines = 3 }: { readonly lines?: number }) {
  const widths = ['84%', '96%', '68%'];
  return (
    <div aria-hidden="true" className="flex flex-col gap-2 p-1">
      {Array.from({ length: lines }, (_, i) => (
        <span
          key={i}
          className="block h-[13px] animate-shimmer rounded-[3px] bg-paper-2"
          style={{ width: widths[i % widths.length] }}
        />
      ))}
    </div>
  );
}
