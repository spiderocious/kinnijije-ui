import { Repeat, Show } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { IconButton } from '@ui/primitives';

import type { StockDraft } from '../types/stock.types';

interface DraftListProps {
  readonly drafts: readonly StockDraft[];
  readonly onRemove: (key: string) => void;
}

/**
 * What has been added so far, as real rows.
 *
 * A count ("2 things") tells somebody nothing — they cannot see what they
 * added, cannot spot a mistake, and cannot remove one thing. Each row is the
 * item, its quantity, and a way to take it straight back out.
 */
export function DraftList({ drafts, onRemove }: DraftListProps) {
  return (
    <Show when={drafts.length > 0}>
      <div className="mt-6">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-overline text-ink-3">
          Adding {drafts.length} thing{drafts.length === 1 ? '' : 's'}
        </p>

        <ul className="flex flex-col gap-2">
          <Repeat each={[...drafts]}>
            {(draft: StockDraft) => (
              <li
                key={draft.key}
                className="flex items-center gap-3 rounded-blade border border-line bg-white px-3 py-2.5"
              >
                <KoboyoIcon name={draft.icon as never} size={24} alone />

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold text-ink">
                    {draft.name}
                  </span>
                  {/* Something we could not place is flagged now, not at save
                      time — the person can fix it while it is still in hand. */}
                  <Show when={draft.recognised === false}>
                    <span className="block text-xs text-ink-3">saved as you typed it</span>
                  </Show>
                </span>

                <span className="shrink-0 font-mono text-sm text-ink-2">
                  {draft.quantity % 1 === 0 ? draft.quantity : draft.quantity.toFixed(1)}{' '}
                  {draft.unit}
                </span>

                <IconButton
                  icon="trash"
                  label={`Remove ${draft.name}`}
                  size="sm"
                  onClick={() => {
                    onRemove(draft.key);
                  }}
                />
              </li>
            )}
          </Repeat>
        </ul>
      </div>
    </Show>
  );
}
