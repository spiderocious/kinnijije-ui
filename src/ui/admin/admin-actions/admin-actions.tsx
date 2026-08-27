import { useState } from 'react';
import { Repeat, Show } from 'meemaw';

import { KoboyoIcon, X, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';
import { ActionMenu, Button, IconButton, type ActionMenuItem } from '@ui/primitives';
import { Input } from '@ui/inputs';
import { DrawerService } from '@ui/drawer';

/**
 * The curator's actions.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview-admin/a01-shell.html
 *              (Actions — 9: bulk-action bar, segmented range, export, danger
 *               action, row action menu)
 *
 * These are admin-only: none has a consumer equivalent, which is why collapsing
 * the register into "the same components at another density" lost them.
 */

/* ---------- Bulk-action bar ---------- */

export interface BulkActionBarProps {
  readonly count: number;
  readonly onClear: () => void;
  /** Safe actions. Destructive ones go in `destructive`. */
  readonly actions: readonly { readonly label: string; readonly icon?: KoboyoIconName; readonly onSelect: () => void }[];
  /** Runs behind a typed confirmation, because bulk is irreversible at scale. */
  readonly destructive?: {
    readonly label: string;
    readonly confirmPhrase: string;
    readonly onConfirm: () => void;
  };
  readonly className?: string;
}

/**
 * Appears when rows are selected, and says how many.
 *
 * **The count is the whole point.** "Delete selected" with no number is how
 * someone deletes 400 recipes meaning to delete 4 — so the count is in the bar
 * AND in the confirmation.
 */
export function BulkActionBar({
  count,
  onClear,
  actions,
  destructive,
  className,
}: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div
      role="toolbar"
      aria-label={`${count} selected`}
      className={cn(
        'sticky bottom-4 z-sticky mx-auto flex w-fit items-center gap-3 rounded-blade border-bold border-ink bg-ink px-4 py-3 text-ink-inv shadow-modal',
        className,
      )}
    >
      <span className="font-mono text-sm font-bold tnum">
        {count} selected
      </span>

      <span className="h-5 w-px bg-white/20" />

      <Repeat each={[...actions]}>
        {(action: { label: string; icon?: KoboyoIconName; onSelect: () => void }) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onSelect}
            className="inline-flex items-center gap-1 rounded-blade-xs px-3 py-1 text-sm font-extrabold transition-colors hover:bg-white/10"
          >
            <Show when={action.icon !== undefined}>
              <KoboyoIcon name={action.icon ?? 'info'} size={14} />
            </Show>
            {action.label}
          </button>
        )}
      </Repeat>

      <Show when={destructive !== undefined}>
        <button
          type="button"
          onClick={() =>
            // The count is repeated in the confirmation — that is the guard.
            DrawerService.critical(`${destructive?.label} ${count} items?`, {
              description: 'This cannot be undone.',
              confirmPhrase: destructive?.confirmPhrase ?? 'DELETE',
              onConfirm: () => destructive?.onConfirm(),
            })
          }
          className="inline-flex items-center gap-1 rounded-blade-xs px-3 py-1 text-sm font-extrabold text-critical transition-colors hover:bg-critical/15"
        >
          <KoboyoIcon name="trash" size={14} />
          {destructive?.label}
        </button>
      </Show>

      <button
        type="button"
        aria-label="Clear selection"
        onClick={onClear}
        className="grid h-6 w-6 place-items-center rounded-round transition-colors hover:bg-white/10"
      >
        <X size={14} strokeWidth={3} />
      </button>
    </div>
  );
}

/* ---------- Segmented range ---------- */

export type RangeKey = '7d' | '30d' | '90d' | 'all';

export interface SegmentedRangeProps {
  readonly value: RangeKey;
  readonly onValueChange: (value: RangeKey) => void;
  readonly className?: string;
}

const RANGE_LABEL: Record<RangeKey, string> = {
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
  all: 'All time',
};

/** The window every console figure is read against. */
export function SegmentedRange({ value, onValueChange, className }: SegmentedRangeProps) {
  const keys: RangeKey[] = ['7d', '30d', '90d', 'all'];

  return (
    <div
      role="radiogroup"
      aria-label="Date range"
      className={cn(
        'inline-flex items-center gap-1 rounded-blade-sm border border-line-2 bg-paper-2 p-1',
        className,
      )}
    >
      <Repeat each={keys}>
        {(key: RangeKey) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={value === key}
            onClick={() => onValueChange(key)}
            className={cn(
              'rounded-blade-xs px-3 py-1 text-sm font-extrabold transition-colors duration-fast',
              'focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]',
              value === key ? 'bg-white text-ink shadow-drop-sm' : 'text-ink-3 hover:text-ink',
            )}
          >
            {RANGE_LABEL[key]}
          </button>
        )}
      </Repeat>
    </div>
  );
}

/* ---------- Export ---------- */

export interface ExportButtonProps {
  readonly onExport: (format: 'csv' | 'json') => void;
  /** How many rows will leave. Stated before the download, not after. */
  readonly rowCount: number;
  readonly disabled?: boolean;
}

/**
 * Export, with the row count stated.
 *
 * **The count is shown before the download starts.** An export that silently
 * produces 40,000 rows when the curator expected 40 is a surprise nobody wants
 * in a spreadsheet.
 */
export function ExportButton({ onExport, rowCount, disabled = false }: ExportButtonProps) {
  const items: ActionMenuItem[] = [
    {
      id: 'csv',
      label: `Export ${rowCount} rows as CSV`,
      icon: 'download',
      onSelect: () => onExport('csv'),
    },
    {
      id: 'json',
      label: `Export ${rowCount} rows as JSON`,
      icon: 'download',
      onSelect: () => onExport('json'),
    },
  ];

  return (
    <span className={cn('inline-flex', disabled && 'pointer-events-none opacity-[0.42]')}>
      <ActionMenu label={`Export ${rowCount} rows`} items={items} orientation="horizontal" />
    </span>
  );
}

/* ---------- Danger action ---------- */

export interface DangerActionProps {
  readonly label: string;
  /** What the user must type. */
  readonly confirmPhrase: string;
  readonly title: string;
  readonly description: string;
  readonly onConfirm: () => void;
  readonly size?: 'sm' | 'md';
  readonly icon?: KoboyoIconName;
}

/**
 * An irreversible console action.
 *
 * **Always behind a typed confirmation** — this component exists so a curator
 * cannot ship a destructive button without one, which is what the shipped admin
 * did for delete-recipe, suspend-user and role-change alike.
 */
export function DangerAction({
  label,
  confirmPhrase,
  title,
  description,
  onConfirm,
  size = 'sm',
  icon = 'trash',
}: DangerActionProps) {
  return (
    <Button
      variant="secondary"
      destructive
      size={size}
      icon={icon}
      onClick={() =>
        DrawerService.critical(title, {
          description,
          confirmPhrase,
          onConfirm,
        })
      }
    >
      {label}
    </Button>
  );
}

/* ---------- Row action menu ---------- */

export interface RowActionMenuProps {
  readonly label: string;
  readonly items: readonly ActionMenuItem[];
}

/** The per-row overflow. Horizontal dots, aligned to the row's end. */
export function RowActionMenu({ label, items }: RowActionMenuProps) {
  return <ActionMenu label={label} items={items} orientation="horizontal" align="end" />;
}

/* ---------- Global search ---------- */

export interface GlobalSearchProps {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly onSubmit?: () => void;
  readonly placeholder?: string;
  readonly className?: string;
}

/**
 * The console's one search box.
 *
 * Searches across every collection rather than the current one — a curator
 * looking for a recipe should not first have to be on the recipes board.
 */
export function GlobalSearch({
  value,
  onValueChange,
  onSubmit,
  placeholder = 'Search recipes, users, prompts…',
  className,
}: GlobalSearchProps) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <span className="pointer-events-none absolute left-3 flex text-ink-3">
        <KoboyoIcon name="searchSlash" size={15} />
      </span>
      <Input
        size="sm"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onSubmit?.();
        }}
        placeholder={placeholder}
        aria-label="Search everything"
        className="pl-9"
      />
      <kbd className="pointer-events-none absolute right-3 rounded-[4px] border border-line-2 bg-paper-2 px-[5px] py-[1px] font-mono text-xs text-ink-4">
        /
      </kbd>
    </div>
  );
}

/* ---------- Filter tabs ---------- */

export interface FilterTab {
  readonly id: string;
  readonly label: string;
  /** The count for this filter. A tab with no count hides how much it hides. */
  readonly count?: number;
}

export interface FilterTabsProps {
  readonly tabs: readonly FilterTab[];
  readonly value: string;
  readonly onValueChange: (id: string) => void;
  readonly className?: string;
}

/**
 * Board filters, with counts.
 *
 * **Each tab carries its count**, because a filter that does not say how many
 * it holds gives a curator no way to know whether the empty board they are
 * looking at is good news or a broken query.
 */
export function FilterTabs({ tabs, value, onValueChange, className }: FilterTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter"
      className={cn('flex items-center gap-1 overflow-x-auto', className)}
    >
      <Repeat each={[...tabs]}>
        {(tab: FilterTab) => {
          const active = tab.id === value;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onValueChange(tab.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-blade-xs px-3 py-[6px] text-sm font-extrabold',
                'transition-colors duration-fast',
                'focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]',
                active ? 'bg-ink text-ink-inv' : 'text-ink-3 hover:bg-paper-2 hover:text-ink',
              )}
            >
              {tab.label}
              <Show when={tab.count !== undefined}>
                <span
                  className={cn(
                    'font-mono text-xs tnum',
                    active ? 'text-ink-inv/70' : 'text-ink-4',
                  )}
                >
                  {tab.count}
                </span>
              </Show>
            </button>
          );
        }}
      </Repeat>
    </div>
  );
}

/* ---------- Column settings ---------- */

export interface ColumnSetting {
  readonly key: string;
  readonly label: string;
  readonly visible: boolean;
  /** Cannot be hidden — the row would stop being identifiable. */
  readonly required?: boolean;
}

export interface ColumnSettingsProps {
  readonly columns: readonly ColumnSetting[];
  readonly onToggle: (key: string, visible: boolean) => void;
  readonly className?: string;
}

/**
 * Which columns a board shows.
 *
 * **A required column cannot be hidden.** Letting someone hide the name column
 * leaves a table of ids, and the way back is not obvious once they have done it.
 */
export function ColumnSettings({ columns, onToggle, className }: ColumnSettingsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('relative inline-flex', className)}>
      <IconButton
        icon="settings"
        label="Column settings"
        size="sm"
        variant="secondary"
        onClick={() => setOpen((c) => !c)}
      />

      <Show when={open}>
        <div
          className="absolute right-0 top-[calc(100%+6px)] z-dropdown min-w-[220px] rounded-blade-sm border-bold border-ink bg-white p-2 shadow-pop animate-slide-down"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
          }}
        >
          <p className="mb-2 px-2 text-xs font-extrabold uppercase tracking-overline text-ink-3">
            Columns
          </p>
          <ul className="flex flex-col gap-[2px]">
            <Repeat each={[...columns]}>
              {(column: ColumnSetting) => (
                <li key={column.key}>
                  <label
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-blade-xs px-2 py-[6px] text-sm',
                      column.required === true ? 'cursor-default opacity-60' : 'hover:bg-paper-2',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={column.visible}
                      disabled={column.required === true}
                      onChange={(event) => onToggle(column.key, event.target.checked)}
                      className="h-4 w-4 accent-[var(--sky)]"
                    />
                    <span className="min-w-0 flex-1 truncate font-semibold text-ink-2">
                      {column.label}
                    </span>
                    <Show when={column.required === true}>
                      <span className="text-xs text-ink-4">always</span>
                    </Show>
                  </label>
                </li>
              )}
            </Repeat>
          </ul>
        </div>
      </Show>
    </div>
  );
}
