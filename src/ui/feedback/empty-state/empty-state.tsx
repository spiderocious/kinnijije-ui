import { Blob, KoboyoIcon, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';
import { Button } from '@ui/primitives';

/**
 * The zero-result surface, and the rule that it must not dead-end.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/156-empty-state.html
 *                                                          157-empty-filtered.html
 *
 * Succeeded, and the answer is zero. **That is often good news** — an empty
 * review queue means the team is on top of it.
 *
 * **An empty state with no way out is a design failure.** Only two kinds
 * legitimately have no action, and both must say which they are:
 *
 * - `kind="good"` — the good outcome (an empty queue, all caught up)
 * - `kind="terminal"` — genuinely nothing more to do
 *
 * Every other empty state MUST supply an action. The discriminated union makes
 * that a compile error rather than a code-review note.
 *
 * A FILTERED empty is a different state — its way out is "clear the filter",
 * never "go and create something". Use `EmptyFiltered`.
 */

interface EmptyBase {
  readonly title: string;
  readonly body?: string;
  /** A koboyo scene mark, or the sleepy chef. */
  readonly art?: KoboyoIconName | 'blob';
  readonly className?: string;
}

type EmptyKind =
  /** Needs a way out — the action is REQUIRED. */
  | {
      readonly kind?: 'actionable';
      readonly action: { readonly label: string; readonly onClick: () => void };
    }
  /** The good outcome — an empty queue. Deliberately no CTA. */
  | { readonly kind: 'good' }
  /** Genuinely terminal. Deliberately no CTA. */
  | { readonly kind: 'terminal' };

export type EmptyStateProps = EmptyBase & EmptyKind;

export function EmptyState(props: EmptyStateProps) {
  const { title, body, art = 'blob', className } = props;
  const good = props.kind === 'good';

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-blade-lg border border-dashed border-line-2 bg-paper-2 px-6 py-9 text-center',
        className,
      )}
    >
      <span className={cn('mb-1', good ? 'text-success' : 'text-ink-3')}>
        {art === 'blob' ? (
          <Blob name="empty" size={64} expression={good ? 'happy' : 'sleepy'} />
        ) : (
          <KoboyoIcon name={art} size={52} alone />
        )}
      </span>

      <p className="font-display text-lg font-extrabold tracking-display">{title}</p>
      {body !== undefined && <p className="max-w-[46ch] text-sm text-ink-2">{body}</p>}

      {props.kind !== 'good' && props.kind !== 'terminal' && (
        <Button className="mt-2" onClick={props.action.onClick}>
          {props.action.label}
        </Button>
      )}
    </div>
  );
}

export interface EmptyFilteredProps {
  /** How many filters are applied, so the copy can be honest. */
  readonly filterCount: number;
  readonly onClear: () => void;
  readonly className?: string;
}

/**
 * A filtered empty is NOT the same as an empty collection — the data exists,
 * the filter is hiding it. Offering "create one" here would be wrong; the way
 * out is always to clear the filter.
 */
/** Visual spec: design-system/projects/kinnijije-v2/preview/157-empty-filtered.html */
export function EmptyFiltered({ filterCount, onClear, className }: EmptyFilteredProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-blade-lg border border-dashed border-line-2 bg-paper-2 px-6 py-8 text-center',
        className,
      )}
    >
      <KoboyoIcon name="funnel" size={40} className="text-ink-3" alone />
      <p className="font-display text-md font-extrabold tracking-display">
        Nothing matches these filters
      </p>
      <p className="max-w-[46ch] text-sm text-ink-2">
        {filterCount === 1
          ? 'One filter is hiding everything here.'
          : `${filterCount} filters are hiding everything here.`}
      </p>
      <Button variant="secondary" className="mt-1" onClick={onClear}>
        Clear {filterCount === 1 ? 'the filter' : 'all filters'}
      </Button>
    </div>
  );
}

/**
 * Still checking whether it is really empty.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/156-empty-state.html
 *
 * **This exists so an empty state is never a guess.** Rendering "Nothing here"
 * while the query is still running tells the user something false, and they act
 * on it — they add a thing they already had, or they leave. This holds the same
 * box until the answer is real.
 */
export function EmptyStateChecking({ className }: { readonly className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('flex flex-col items-center gap-3 px-6 py-10 text-center', className)}
    >
      <span className="block h-[56px] w-[56px] animate-shimmer rounded-round bg-paper-2" />
      <span className="block h-[16px] w-44 animate-shimmer rounded-[3px] bg-paper-2" />
      <span className="block h-[13px] w-64 animate-shimmer rounded-[3px] bg-paper-2" />
    </div>
  );
}
