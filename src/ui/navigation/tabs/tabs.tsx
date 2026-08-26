import { createContext, useContext, useRef, type KeyboardEvent, type ReactNode } from 'react';

import { cn } from '@shared/utils/cn';
import { Badge } from '@ui/status';

/**
 * The content switch.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/183-tabs.html
 *
 * **Tabs LOAD different data; a segmented control RESHAPES data already
 * loaded.** That is the whole distinction and it decides which one you reach
 * for. Getting it wrong gives a product two navigation idioms that look
 * identical and behave differently.
 *
 * Because a tab loads, each panel owns its own loading and empty states — the
 * tab strip never blocks on one.
 */

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs(component: string): TabsContextValue {
  const context = useContext(TabsContext);
  if (context === null) throw new Error(`${component} must be rendered inside <Tabs>.`);
  return context;
}

export interface TabsProps {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly className?: string;
  readonly children: ReactNode;
}

function TabsRoot({ value, onValueChange, className, children }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

function TabsList({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  const listRef = useRef<HTMLDivElement>(null);

  /** Roving focus across the strip, wrapping at both ends. */
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

    const tabs = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])') ?? [],
    );
    if (tabs.length === 0) return;

    const index = tabs.findIndex((tab) => tab === document.activeElement);
    event.preventDefault();

    let next: number;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else if (event.key === 'ArrowLeft') next = index <= 0 ? tabs.length - 1 : index - 1;
    else next = index === tabs.length - 1 ? 0 : index + 1;

    const target = tabs[next];
    if (target !== undefined) {
      target.focus();
      target.click();
    }
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className="flex items-center gap-1 overflow-x-auto border-b border-line"
    >
      {children}
    </div>
  );
}

export interface TabProps {
  readonly value: string;
  /** An unread or pending count. */
  readonly count?: number;
  readonly disabled?: boolean;
  readonly children: ReactNode;
}

function Tab({ value, count, disabled = false, children }: TabProps) {
  const context = useTabs('Tabs.Tab');
  const selected = context.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      disabled={disabled}
      tabIndex={selected ? 0 : -1}
      onClick={() => context.onValueChange(value)}
      className={cn(
        'relative flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-3',
        'text-ctrl font-extrabold transition-colors duration-fast',
        'focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_3px_var(--sky-glow)]',
        'disabled:opacity-[0.42] disabled:cursor-not-allowed',
        selected ? 'text-sky-on' : 'text-ink-3 hover:text-ink',
      )}
    >
      {children}
      {count !== undefined && count > 0 && <Badge count={count} />}
      {/* The selected rule — a pill so it reads as an underline, not a blade. */}
      {selected && (
        <span
          aria-hidden="true"
          className="absolute inset-x-2 bottom-0 h-[3px] rounded-pill bg-sky"
        />
      )}
    </button>
  );
}

export interface TabPanelProps {
  readonly value: string;
  readonly className?: string;
  readonly children: ReactNode;
}

function TabPanel({ value, className, children }: TabPanelProps) {
  const context = useTabs('Tabs.Panel');
  if (context.value !== value) return null;

  return (
    <div role="tabpanel" className={cn('pt-4 animate-fade', className)}>
      {children}
    </div>
  );
}

export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Tab,
  Panel: TabPanel,
});
