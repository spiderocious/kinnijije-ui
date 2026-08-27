import type { ReactNode } from 'react';
import { Show } from 'meemaw';

import { ArrowLeft } from '@icons';
import { cn } from '@shared/utils/cn';
import { Badge } from '@ui/status';

/**
 * The console's chrome.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview-admin/a01-shell.html
 *              (Navigation — 11: shell, sidebar, topbar, global search,
 *               breadcrumb, tabs, page header, back link, nav badge,
 *               operator footer, section nav)
 */

export interface AdminTopbarProps {
  readonly search?: ReactNode;
  readonly actions?: ReactNode;
  readonly className?: string;
}

/** The bar above every console screen. Search left, actions right. */
export function AdminTopbar({ search, actions, className }: AdminTopbarProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 border-b border-line bg-white px-5 py-2',
        className,
      )}
    >
      <Show when={search !== undefined}>
        <div className="min-w-0 max-w-[340px] flex-1">{search}</div>
      </Show>
      <Show when={actions !== undefined}>
        <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>
      </Show>
    </div>
  );
}

export interface PageHeaderProps {
  readonly title: string;
  readonly subtitle?: ReactNode;
  /** Breadcrumb or back link. */
  readonly above?: ReactNode;
  readonly actions?: ReactNode;
  /** Filter tabs or a section nav, sitting under the title. */
  readonly below?: ReactNode;
  readonly className?: string;
}

/**
 * A console screen's heading block.
 *
 * The `below` slot is why this is a component rather than an `<h1>`: filter
 * tabs belong to the header, not the board, and every screen that put them in
 * the board got a different gap.
 */
export function PageHeader({
  title,
  subtitle,
  above,
  actions,
  below,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('border-b border-line bg-white px-5 pt-4', className)}>
      <Show when={above !== undefined}>
        <div className="mb-2">{above}</div>
      </Show>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate font-display text-lg font-extrabold tracking-display">
            {title}
          </h1>
          <Show when={subtitle !== undefined}>
            <div className="mt-[2px] text-sm text-ink-3">{subtitle}</div>
          </Show>
        </div>
        <Show when={actions !== undefined}>
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        </Show>
      </div>

      <Show when={below !== undefined}>
        <div className="mt-3 pb-1">{below}</div>
      </Show>
      <Show when={below === undefined}>
        <div className="pb-4" />
      </Show>
    </header>
  );
}

export interface BackLinkProps {
  /** Omit while the destination is still resolving — the control holds its place. */
  readonly label?: string;
  readonly onNavigate: () => void;
  readonly className?: string;
}

/**
 * Up one level.
 *
 * **Names the destination, never "Back".** A browser already has Back; this
 * says where it goes, which is the only thing it adds.
 */
/** Visual spec: design-system/projects/kinnijije-v2/preview/186-back-link.html */
export function BackLink({ label, onNavigate, className }: BackLinkProps) {
  // Destination unknown yet — the control holds its place, disabled, rather
  // than appearing late and shifting the header once the route resolves.
  const resolving = label === undefined;

  return (
    <button
      type="button"
      disabled={resolving}
      onClick={onNavigate}
      className={cn(
        'inline-flex items-center gap-1 rounded-[3px] text-sm font-extrabold text-ink-3',
        'transition-colors hover:text-ink focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]',
        className,
      )}
    >
      <ArrowLeft size={15} strokeWidth={2.5} aria-hidden="true" />
      {resolving ? (
        <span
          aria-hidden="true"
          className="block h-[13px] w-20 animate-shimmer rounded-[3px] bg-paper-2"
        />
      ) : (
        label
      )}
    </button>
  );
}

export interface NavBadgeProps {
  readonly count: number;
  readonly label: string;
}

/** A count on a nav item. Zero renders nothing. */
export function NavBadge({ count, label }: NavBadgeProps) {
  return <Badge count={count} label={label} />;
}

export interface OperatorFooterProps {
  readonly operator: string;
  /** Which environment this console is pointed at. */
  readonly environment: 'production' | 'staging' | 'local';
  readonly version?: string;
  readonly className?: string;
}

/**
 * Who you are and what you are pointed at.
 *
 * **The environment is the point.** A curator with staging and production open
 * in two tabs needs to know which one they are about to publish from, and the
 * two look otherwise identical.
 */
export function OperatorFooter({
  operator,
  environment,
  version,
  className,
}: OperatorFooterProps) {
  const envClass = {
    production: 'bg-critical-soft text-critical-onsoft border-critical-border',
    staging: 'bg-caution-soft text-caution-onsoft border-caution-border',
    local: 'bg-neutral-soft text-neutral-onsoft border-neutral-border',
  }[environment];

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 border-t border-line px-4 py-2 text-xs',
        className,
      )}
    >
      <span className="min-w-0 truncate font-mono text-ink-3">{operator}</span>
      {/* Loud on production, deliberately. */}
      <span
        className={cn(
          'shrink-0 rounded-blade-xs border px-2 py-[1px] font-mono font-bold uppercase',
          envClass,
        )}
      >
        {environment}
      </span>
      <Show when={version !== undefined}>
        <span className="ml-auto shrink-0 font-mono text-ink-4">{version}</span>
      </Show>
    </div>
  );
}

export interface SectionNavItem {
  readonly id: string;
  readonly label: string;
  readonly count?: number;
}

export interface SectionNavProps {
  readonly items: readonly SectionNavItem[];
  readonly value: string;
  readonly onValueChange: (id: string) => void;
  readonly className?: string;
}

/** In-page navigation for a long console screen. */
export function SectionNav({ items, value, onValueChange, className }: SectionNavProps) {
  return (
    <nav aria-label="Sections" className={cn('flex flex-col gap-[2px]', className)}>
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? 'true' : undefined}
            onClick={() => onValueChange(item.id)}
            className={cn(
              'flex items-center justify-between gap-2 rounded-blade-xs px-3 py-[6px] text-left text-sm',
              'transition-colors duration-fast',
              active ? 'bg-paper-2 font-extrabold text-ink' : 'font-semibold text-ink-3 hover:text-ink',
            )}
          >
            <span className="min-w-0 truncate">{item.label}</span>
            <Show when={item.count !== undefined}>
              <span className="shrink-0 font-mono text-xs text-ink-4">{item.count}</span>
            </Show>
          </button>
        );
      })}
    </nav>
  );
}

/* ---------- Structure ---------- */

export interface SplitLayoutProps {
  readonly left: ReactNode;
  readonly right: ReactNode;
  /** The left pane's width. The right one takes the rest. */
  readonly leftWidth?: string;
  readonly className?: string;
}

/** Two panes, one fixed. */
export function SplitLayout({
  left,
  right,
  leftWidth = '320px',
  className,
}: SplitLayoutProps) {
  return (
    <div
      className={cn('grid gap-5', className)}
      style={{ gridTemplateColumns: `${leftWidth} minmax(0, 1fr)` }}
    >
      {left}
      {right}
    </div>
  );
}

export interface ThreePaneProps {
  readonly list: ReactNode;
  readonly detail: ReactNode;
  readonly aside: ReactNode;
  readonly className?: string;
}

/**
 * List, detail and aside — the recipe-review layout.
 *
 * **The three panes are why review is fast**: the queue stays visible while a
 * recipe is open, so a curator never loses their place in the list they are
 * working down.
 */
export function ThreePane({ list, detail, aside, className }: ThreePaneProps) {
  return (
    <div
      className={cn('grid gap-5', className)}
      style={{ gridTemplateColumns: '280px minmax(0, 1fr) 300px' }}
    >
      {list}
      {detail}
      {aside}
    </div>
  );
}

export interface ToolbarProps {
  readonly children: ReactNode;
  readonly className?: string;
}

/** A row of controls above a board. */
export function Toolbar({ children, className }: ToolbarProps) {
  return (
    <div
      role="toolbar"
      className={cn('flex flex-wrap items-center gap-2 border-b border-line px-5 py-2', className)}
    >
      {children}
    </div>
  );
}

export interface FilterRailProps {
  readonly title?: string;
  readonly onClearAll?: () => void;
  readonly activeCount?: number;
  readonly children: ReactNode;
  readonly className?: string;
}

/**
 * The filter column beside a board.
 *
 * **It states how many filters are on and offers to clear them.** A board
 * filtered down to nothing with no visible reason is the most common way a
 * curator concludes the data is missing.
 */
export function FilterRail({
  title = 'Filters',
  onClearAll,
  activeCount = 0,
  children,
  className,
}: FilterRailProps) {
  return (
    <aside className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-extrabold uppercase tracking-overline text-ink-3">
          {title}
          <Show when={activeCount > 0}>
            <span className="ml-1 font-mono normal-case tracking-normal text-ink">
              · {activeCount}
            </span>
          </Show>
        </p>
        <Show when={activeCount > 0 && onClearAll !== undefined}>
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-extrabold text-sky-on underline decoration-2 underline-offset-2"
          >
            Clear all
          </button>
        </Show>
      </div>
      {children}
    </aside>
  );
}

export interface AdminShellProps {
  readonly sidebar: ReactNode;
  readonly topbar?: ReactNode;
  readonly footer?: ReactNode;
  readonly children: ReactNode;
}

/**
 * The console frame.
 *
 * **One wrapper class resolves the whole register** — `.counter` sits here and
 * nowhere else, which is what keeps two registers from becoming two systems.
 */
export function AdminShell({ sidebar, topbar, footer, children }: AdminShellProps) {
  return (
    <div className="counter flex min-h-full bg-paper">
      <div className="flex shrink-0 flex-col">
        <div className="flex-1">{sidebar}</div>
        <Show when={footer !== undefined}>{footer}</Show>
      </div>

      <main className="flex min-w-0 flex-1 flex-col">
        <Show when={topbar !== undefined}>{topbar}</Show>
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
