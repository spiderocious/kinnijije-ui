import { Repeat, Show } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { cn } from '@shared/utils/cn';

/**
 * The ingredient reconciliation — where a count becomes a shopping list.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/261-have-need.html
 *                                                          134-status-have-need.html
 *
 * The recipe's ingredients against the basket. **The need list is enumerable**,
 * unlike the meal card where it is only a count — that difference is the whole
 * reason this component exists rather than a second badge.
 *
 * **"Need" is NEUTRAL, never critical.** Shopping is not an error state, and
 * colouring it red turns a normal Tuesday into a failure report.
 */

export interface HaveNeedItem {
  readonly id: string;
  readonly name: string;
  readonly quantity?: string;
  /** An uncertain match from a photo extraction. */
  readonly maybe?: boolean;
}

export interface HaveNeedProps {
  readonly have: readonly HaveNeedItem[];
  readonly need: readonly HaveNeedItem[];
  /** No basket at all — everything reads as 'need', and it says so. */
  readonly noBasket?: boolean;
  /** Matched against a cached basket. */
  readonly staleLabel?: string;
  readonly className?: string;
}

function Column({
  title,
  count,
  items,
  tone,
}: {
  readonly title: string;
  readonly count: number;
  readonly items: readonly HaveNeedItem[];
  readonly tone: 'have' | 'need';
}) {
  return (
    <div className="min-w-0 flex-1">
      <p
        className={cn(
          'mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-overline',
          tone === 'have' ? 'text-success-onsoft' : 'text-ink-3',
        )}
      >
        <KoboyoIcon name={tone === 'have' ? 'tick' : 'shoppingBasket'} size={14} />
        {title} · <span className="font-mono tnum">{count}</span>
      </p>

      <ul className="flex flex-col gap-[6px]">
        <Repeat each={[...items]}>
          {(item: HaveNeedItem) => (
            <li
              key={item.id}
              className={cn(
                'flex items-baseline justify-between gap-2 rounded-blade-xs border px-3 py-[6px]',
                tone === 'have'
                  ? 'border-success-border bg-success-soft'
                  : item.maybe === true
                    ? 'border-caution-border bg-caution-soft'
                    : 'border-neutral-border bg-neutral-soft',
              )}
            >
              <span
                className={cn(
                  'min-w-0 truncate text-sm font-semibold',
                  tone === 'have' ? 'text-success-onsoft' : 'text-neutral-onsoft',
                )}
              >
                {item.name}
              </span>
              {item.quantity !== undefined && (
                <span className="shrink-0 font-mono text-xs text-ink-3">{item.quantity}</span>
              )}
            </li>
          )}
        </Repeat>
      </ul>
    </div>
  );
}

export function HaveNeed({ have, need, noBasket = false, staleLabel, className }: HaveNeedProps) {
  return (
    <div className={className}>
      <Show when={noBasket}>
        <p className="mb-3 rounded-blade-xs border border-neutral-border bg-neutral-soft px-3 py-2 text-sm text-neutral-onsoft">
          You have not told us what is in your kitchen, so everything shows as needed.
        </p>
      </Show>

      <div className="flex gap-4">
        <Show when={have.length > 0}>
          <Column title="You have" count={have.length} items={have} tone="have" />
        </Show>
        <Show when={need.length > 0}>
          <Column title="You need" count={need.length} items={need} tone="need" />
        </Show>
      </div>

      <Show when={staleLabel !== undefined}>
        <p className="mt-2 font-mono text-xs text-ink-4">matched {staleLabel}</p>
      </Show>
    </div>
  );
}

/** Both columns, at measure. */
export function HaveNeedSkeleton() {
  return (
    <div aria-hidden="true" className="flex gap-4">
      {[0, 1].map((column) => (
        <div key={column} className="flex-1">
          <div className="mb-2 h-[13px] w-1/2 animate-shimmer rounded-[3px] bg-skeleton" />
          <div className="flex flex-col gap-[6px]">
            {[0, 1, 2].map((row) => (
              <div key={row} className="h-[32px] animate-shimmer rounded-blade-xs bg-skeleton" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
