import { useEffect, useRef, useState } from 'react';
import { Repeat, Show } from 'meemaw';

import { KoboyoIcon, MoreHorizontal, MoreVertical, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';

/**
 * The overflow menu — where the second control goes.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/38-action-menu.html
 *
 * Every component in this system that takes a trailing slot says the same
 * thing: **at most ONE control; a second belongs here.** This is that here.
 *
 * Destructive items sit at the bottom, separated — so the muscle memory for
 * "the last item" is never "the dangerous one" on a menu that grows.
 */

export interface ActionMenuItem {
  readonly id: string;
  readonly label: string;
  readonly icon?: KoboyoIconName;
  readonly destructive?: boolean;
  readonly disabled?: boolean;
  readonly onSelect: () => void;
}

export interface ActionMenuProps {
  readonly items: readonly ActionMenuItem[];
  /** Announced to screen readers — "More actions for Jollof Rice". */
  readonly label: string;
  readonly orientation?: 'horizontal' | 'vertical';
  readonly align?: 'start' | 'end';
  readonly className?: string;
}

export function ActionMenu({
  items,
  label,
  orientation = 'vertical',
  align = 'end',
  className,
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node) === false) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Destructive items are pushed to the bottom so a growing menu never puts a
  // dangerous action where a safe one used to be.
  const safe = items.filter((item) => item.destructive !== true);
  const dangerous = items.filter((item) => item.destructive === true);

  function renderItem(item: ActionMenuItem) {
    return (
      <li key={item.id} role="none">
        <button
          type="button"
          role="menuitem"
          disabled={item.disabled}
          onClick={() => {
            item.onSelect();
            setOpen(false);
          }}
          className={cn(
            'flex w-full items-center gap-2 rounded-blade-xs px-3 py-2 text-left text-ctrl font-semibold',
            'transition-colors duration-fast',
            'disabled:opacity-[0.42] disabled:cursor-not-allowed',
            item.destructive === true
              ? 'text-critical-onsoft hover:bg-critical-soft'
              : 'text-ink-2 hover:bg-paper-2 hover:text-ink',
          )}
        >
          <Show when={item.icon !== undefined}>
            <KoboyoIcon name={item.icon ?? 'info'} size={15} className="shrink-0" />
          </Show>
          {item.label}
        </button>
      </li>
    );
  }

  return (
    <div ref={rootRef} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((c) => !c)}
        className={cn(
          'grid h-ctrl-sm w-ctrl-sm place-items-center rounded-blade-xs text-ink-3',
          'transition-colors duration-fast hover:bg-paper-2 hover:text-ink',
          'focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]',
          open && 'bg-paper-2 text-ink',
        )}
      >
        {orientation === 'vertical' ? <MoreVertical size={17} /> : <MoreHorizontal size={17} />}
      </button>

      <Show when={open}>
        <ul
          role="menu"
          aria-label={label}
          className={cn(
            'absolute top-[calc(100%+6px)] z-dropdown min-w-[190px]',
            'rounded-blade-sm border-bold border-ink bg-white p-1 shadow-pop animate-slide-down',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          <Repeat each={safe}>{renderItem}</Repeat>

          <Show when={dangerous.length > 0 && safe.length > 0}>
            <li role="separator" className="my-1 h-px bg-line" />
          </Show>

          <Repeat each={dangerous}>{renderItem}</Repeat>
        </ul>
      </Show>
    </div>
  );
}
