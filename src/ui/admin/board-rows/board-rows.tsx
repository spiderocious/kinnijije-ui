import type { ReactNode } from 'react';
import { Repeat, Show } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { cn } from '@shared/utils/cn';
import { Figure, PriceDisplay } from '@ui/display';
import { Status } from '@ui/status';
import { Avatar } from '@ui/structure';
import { Provenance, isApproximate, type RecipeSource } from '@ui/domain';

/**
 * The five board-row shapes.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview-admin/a03-recipes.html
 *                                                                a05-ai-audit.html
 *                                                                a07-users.html
 *                                                                a08-feedback.html
 *                                                                a09-flags.html
 *
 * A board row is not a consumer row at a different density: it carries the
 * columns a curator sorts and compares by, and it is selectable — the consumer
 * app has nothing that needs a checkbox.
 */

interface BoardRowShellProps {
  readonly selected?: boolean;
  readonly onSelectedChange?: (selected: boolean) => void;
  readonly onPress?: () => void;
  readonly trailing?: ReactNode;
  readonly className?: string;
  readonly children: ReactNode;
}

function BoardRowShell({
  selected = false,
  onSelectedChange,
  onPress,
  trailing,
  className,
  children,
}: BoardRowShellProps) {
  return (
    <tr
      className={cn(
        'border-b border-line transition-colors',
        selected ? 'bg-sky-soft' : 'hover:bg-paper-2',
        onPress !== undefined && 'cursor-pointer',
        className,
      )}
      onClick={onPress}
    >
      {/* The cell is always present so every row in a selectable board keeps the
          same column count. Omitting it on non-selectable rows shifts their
          content half a column left of their neighbours. */}
      <td className="w-[40px] py-row-y pl-3">
        <Show when={onSelectedChange !== undefined}>
          <input
            type="checkbox"
            checked={selected}
            aria-label="Select row"
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => onSelectedChange?.(event.target.checked)}
            className="h-4 w-4 accent-[var(--sky)]"
          />
        </Show>
      </td>
      {children}
      <Show when={trailing !== undefined}>
        <td className="py-row-y pr-3 text-right" onClick={(event) => event.stopPropagation()}>
          {trailing}
        </td>
      </Show>
    </tr>
  );
}

/* ---------- Recipe ---------- */

export interface BoardRowRecipeProps extends Omit<BoardRowShellProps, 'children'> {
  readonly name: string;
  readonly source: RecipeSource;
  readonly minutes: number;
  readonly status: 'published' | 'draft';
  readonly updated: string;
}

function BoardRowRecipe({
  name,
  source,
  minutes,
  status,
  updated,
  ...shell
}: BoardRowRecipeProps) {
  return (
    <BoardRowShell {...shell}>
      <td className="py-row-y pr-3">
        <span className="flex items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-blade-xs bg-dish-fill text-dish-line">
            <KoboyoIcon name="plateJollofRice" size={16} />
          </span>
          <span className="min-w-0 truncate font-semibold text-ink">{name}</span>
        </span>
      </td>
      <td className="w-[140px] py-row-y pr-3">
        <Provenance source={source} size="sm" />
      </td>
      <td className="w-[80px] py-row-y pr-3 text-right">
        <Figure value={minutes} unit="m" approximate={isApproximate(source)} size="sm" />
      </td>
      <td className="w-[120px] py-row-y pr-3">
        <Status kind="recipe" value={status} size="sm" />
      </td>
      <td className="w-[110px] py-row-y pr-3 text-right font-mono text-xs text-ink-3">
        {updated}
      </td>
    </BoardRowShell>
  );
}

/* ---------- User ---------- */

export interface BoardRowUserProps extends Omit<BoardRowShellProps, 'children'> {
  readonly name: string;
  readonly email: string;
  readonly role: 'admin' | 'user';
  readonly status: 'active' | 'suspended';
  readonly cookedCount: number;
  readonly joined: string;
}

function BoardRowUser({
  name,
  email,
  role,
  status,
  cookedCount,
  joined,
  ...shell
}: BoardRowUserProps) {
  return (
    <BoardRowShell {...shell}>
      <td className="py-row-y pr-3">
        <Avatar name={email} size={26} label={name} sublabel={email} />
      </td>
      <td className="w-[100px] py-row-y pr-3">
        <Status kind="role" value={role} size="sm" />
      </td>
      <td className="w-[120px] py-row-y pr-3">
        <Status kind="user" value={status} size="sm" />
      </td>
      <td className="w-[90px] py-row-y pr-3 text-right">
        <Figure value={cookedCount} size="sm" muted />
      </td>
      <td className="w-[110px] py-row-y pr-3 text-right font-mono text-xs text-ink-3">
        {joined}
      </td>
    </BoardRowShell>
  );
}

/* ---------- AI audit ---------- */

export interface BoardRowAuditProps extends Omit<BoardRowShellProps, 'children'> {
  readonly kind: 'vision' | 'whisper' | 'parse' | 'generate';
  readonly result: 'ok' | 'error';
  readonly model: string;
  readonly latencyMs: number;
  readonly cost: string;
  readonly when: string;
}

function BoardRowAudit({
  kind,
  result,
  model,
  latencyMs,
  cost,
  when,
  ...shell
}: BoardRowAuditProps) {
  return (
    <BoardRowShell {...shell}>
      <td className="w-[120px] py-row-y pr-3">
        <Status kind="ai-kind" value={kind} size="sm" />
      </td>
      <td className="py-row-y pr-3 font-mono text-xs text-ink-2">{model}</td>
      <td className="w-[110px] py-row-y pr-3">
        <Status kind="ai-result" value={result} size="sm" />
      </td>
      <td className="w-[100px] py-row-y pr-3 text-right">
        <Figure value={latencyMs} unit="ms" size="sm" muted />
      </td>
      <td className="w-[90px] py-row-y pr-3 text-right">
        <PriceDisplay amount={cost} currency="$" size="sm" />
      </td>
      <td className="w-[90px] py-row-y pr-3 text-right font-mono text-xs text-ink-3">{when}</td>
    </BoardRowShell>
  );
}

/* ---------- Feedback ---------- */

export interface BoardRowFeedbackProps extends Omit<BoardRowShellProps, 'children'> {
  readonly quote: string;
  readonly target: 'step' | 'ingredient';
  readonly status: 'open' | 'reviewed';
  readonly recipe: string;
  readonly when: string;
}

function BoardRowFeedback({
  quote,
  target,
  status,
  recipe,
  when,
  ...shell
}: BoardRowFeedbackProps) {
  return (
    <BoardRowShell {...shell}>
      {/* The quote is the column that matters — it gets the width. */}
      <td className="py-row-y pr-3">
        <span className="block truncate text-ctrl text-ink">“{quote}”</span>
        <span className="block truncate text-xs text-ink-3">{recipe}</span>
      </td>
      <td className="w-[120px] py-row-y pr-3">
        <Status kind="feedback-target" value={target} size="sm" />
      </td>
      <td className="w-[110px] py-row-y pr-3">
        <Status kind="feedback" value={status} size="sm" />
      </td>
      <td className="w-[110px] py-row-y pr-3 text-right font-mono text-xs text-ink-3">{when}</td>
    </BoardRowShell>
  );
}

/* ---------- Flag ---------- */

export interface BoardRowFlagProps extends Omit<BoardRowShellProps, 'children'> {
  readonly flag: string;
  readonly on: boolean;
  /** REQUIRED — the consequence, in a column of its own. */
  readonly consequence: string;
  readonly changedBy?: string;
  readonly changedAt?: string;
}

function BoardRowFlag({
  flag,
  on,
  consequence,
  changedBy,
  changedAt,
  ...shell
}: BoardRowFlagProps) {
  return (
    <BoardRowShell {...shell}>
      <td className="w-[180px] py-row-y pr-3">
        <code className="font-mono text-sm font-bold text-ink">{flag}</code>
      </td>
      <td className="w-[90px] py-row-y pr-3">
        <Status kind="flag" value={on ? 'on' : 'off'} size="sm" />
      </td>
      {/* The consequence has a column, not a tooltip. */}
      <td className="py-row-y pr-3 text-sm text-ink-2">{consequence}</td>
      <td className="w-[150px] py-row-y pr-3 text-right font-mono text-xs text-ink-3">
        <Show when={changedBy !== undefined}>
          <span className="block truncate">{changedBy}</span>
        </Show>
        <Show when={changedAt !== undefined}>
          <span className="block text-ink-4">{changedAt}</span>
        </Show>
      </td>
    </BoardRowShell>
  );
}

/** Visual spec: design-system/projects/kinnijije-v2/preview/222-row-audit.html */
/** Visual spec: design-system/projects/kinnijije-v2/preview/223-row-feedback.html */
/** Visual spec: design-system/projects/kinnijije-v2/preview/224-row-flag.html */
/**
 * A board row, loading — row-shaped, at the true measure.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/222-row-audit.html
 *
 * Takes the column widths so the shimmer lands under the real headers. A board
 * that loads through evenly-spaced grey bars jumps sideways when the data
 * arrives, and on a table an operator is scanning by column, that is worse than
 * a blank pause.
 */
function BoardRowSkeleton({
  columns,
  selectable = false,
}: {
  readonly columns: readonly number[];
  readonly selectable?: boolean;
}) {
  return (
    <tr aria-hidden="true" className="border-b border-line">
      <td className="w-[40px] py-row-y pl-3">
        <Show when={selectable}>
          <span className="block h-4 w-4 animate-shimmer rounded-[3px] bg-skeleton" />
        </Show>
      </td>
      <Repeat each={[...columns]}>
        {(width: number, index: number) => (
          <td key={index} className="py-row-y pr-3">
            <span
              className="block h-[14px] animate-shimmer rounded-[3px] bg-skeleton"
              style={{ width: `${width}%` }}
            />
          </td>
        )}
      </Repeat>
    </tr>
  );
}

/** From cache, with its age. Sits in the row's last column. */
function BoardRowStale({ age }: { readonly age: string }) {
  return <span className="font-mono text-xs text-ink-4">cached · {age}</span>;
}

export const BoardRow = {
  Recipe: BoardRowRecipe,
  User: BoardRowUser,
  Audit: BoardRowAudit,
  Feedback: BoardRowFeedback,
  Flag: BoardRowFlag,
  Skeleton: BoardRowSkeleton,
  Stale: BoardRowStale,
};
