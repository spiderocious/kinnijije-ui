import { createContext, useContext, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';

import { KoboyoIcon, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';

/**
 * The view switch — one of N.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/27-segmented.html
 *
 * Distinct from Tabs by what it does to the data, not by how it looks: if the
 * options LOAD different data they are Tabs; if they RESHAPE what is already
 * loaded they are a segmented control. Getting this wrong is how a product ends
 * up with two navigation idioms that look identical and behave differently.
 *
 * Compound Root + slots rather than an options-array prop, so an item can carry
 * an icon, a count or a disabled reason without the Root growing a config
 * object for each.
 */

interface SegmentedContextValue {
  value: string;
  onValueChange: (value: string) => void;
  name: string;
  disabled: boolean;
}

const SegmentedContext = createContext<SegmentedContextValue | null>(null);

function useSegmented(component: string): SegmentedContextValue {
  const context = useContext(SegmentedContext);
  if (context === null) {
    throw new Error(`${component} must be rendered inside <Segmented>.`);
  }
  return context;
}

export interface SegmentedProps {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  /** Disables the whole control — an individual item disables itself. */
  readonly disabled?: boolean;
  /** Announced to screen readers as the group's purpose. */
  readonly label?: string;
  readonly className?: string;
  readonly children: ReactNode;
}

function SegmentedRoot({
  value,
  onValueChange,
  disabled = false,
  label,
  className,
  children,
}: SegmentedProps) {
  const name = useId();
  const listRef = useRef<HTMLDivElement>(null);

  /** Roving focus: arrow keys move between items and wrap at both ends. */
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;

    const items = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]:not([disabled])') ?? [],
    );
    if (items.length === 0) return;

    const currentIndex = items.findIndex((item) => item === document.activeElement);
    event.preventDefault();

    let nextIndex: number;
    if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = items.length - 1;
    else if (event.key === 'ArrowLeft')
      nextIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
    else nextIndex = currentIndex === items.length - 1 ? 0 : currentIndex + 1;

    const next = items[nextIndex];
    if (next !== undefined) {
      next.focus();
      next.click();
    }
  }

  return (
    <SegmentedContext.Provider value={{ value, onValueChange, name, disabled }}>
      <div
        ref={listRef}
        role="radiogroup"
        aria-label={label}
        onKeyDown={handleKeyDown}
        className={cn(
          'inline-flex items-center gap-1 rounded-blade-sm border border-ink bg-paper-2 p-1',
          disabled && 'opacity-[0.42] pointer-events-none',
          className,
        )}
      >
        {children}
      </div>
    </SegmentedContext.Provider>
  );
}

export interface SegmentedItemProps {
  readonly value: string;
  readonly icon?: KoboyoIconName;
  readonly disabled?: boolean;
  readonly children: ReactNode;
}

function SegmentedItem({ value, icon, disabled = false, children }: SegmentedItemProps) {
  const context = useSegmented('Segmented.Item');
  const selected = context.value === value;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled || context.disabled}
      tabIndex={selected ? 0 : -1}
      onClick={() => context.onValueChange(value)}
      className={cn(
        'inline-flex h-ctrl-sm items-center gap-2 whitespace-nowrap rounded-blade-xs px-4',
        'text-ctrl font-extrabold cursor-pointer',
        'transition-colors duration-fast ease-kj',
        'focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--sky-glow)]',
        'disabled:opacity-[0.42] disabled:cursor-not-allowed',
        selected
          ? 'bg-sky text-sky-onbase shadow-drop-sm'
          : 'bg-transparent text-ink-2 hover:bg-white hover:text-ink',
      )}
    >
      {icon !== undefined && <KoboyoIcon name={icon} size={15} className="shrink-0" />}
      {children}
    </button>
  );
}

export interface SegmentedPanelProps {
  /** Renders only while this value is selected. */
  readonly value: string;
  readonly className?: string;
  readonly children: ReactNode;
}

function SegmentedPanel({ value, className, children }: SegmentedPanelProps) {
  const context = useSegmented('Segmented.Panel');
  if (context.value !== value) return null;

  return (
    <div role="region" className={cn('animate-fade', className)}>
      {children}
    </div>
  );
}

export const Segmented = Object.assign(SegmentedRoot, {
  Item: SegmentedItem,
  Panel: SegmentedPanel,
});
