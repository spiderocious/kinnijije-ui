import { Repeat, Show } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { Callout } from '@ui/feedback';
import { Select } from '@ui/inputs';
import { Button, IconButton } from '@ui/primitives';

import type { StockDraft } from '../types/stock.types';

interface StockConfirmProps {
  readonly drafts: readonly StockDraft[];
  readonly onChange: (key: string, changes: Partial<StockDraft>) => void;
  readonly onRemove: (key: string) => void;
  readonly onAddUnit: () => void;
  readonly customUnits: readonly { label: string; abbr: string }[];
  readonly notes?: { summary?: string; assumptions?: string[]; warnings?: string[]; errors?: string[] };
}

/** What a local measure actually means, so nobody has to already know. */
const UNIT_HINTS: Record<string, string> = {
  congo: 'a milk-tin measure — about a third of a kilo',
  derica: 'a tomato-tin measure — about half a kilo',
  tin: 'a tenth of a congo',
  paint_bucket: 'about four kilos',
  bag: 'whatever size the seller sold you',
  basket: 'a market basket — size varies',
  piece: 'counted, one by one',
  bunch: 'sold as a bunch',
  wrap: 'sold wrapped',
  handful: 'roughly a handful',
};

/**
 * The confirm step — everything lands here, typed or read from a photo.
 *
 * Each row is LABELLED. A bare "1 [−] [+] [congo ▾]" assumes the person already
 * knows what the number and the dropdown are for; saying "How much?" and
 * "Measured in" costs two lines and removes the guessing.
 */
export function StockConfirm({
  drafts,
  onChange,
  onRemove,
  onAddUnit,
  customUnits,
  notes,
}: StockConfirmProps) {
  return (
    <div className="flex flex-col gap-4">
      <Show when={drafts.length > 0}>
        <p className="text-sm text-ink-2">
          Check the amounts before these go in. Nothing is saved until you confirm.
        </p>
      </Show>

      {/* Shown ONLY when the read had something to say. An always-present
          "no issues" block is one people stop reading. */}
      <Show when={notes?.errors !== undefined && notes.errors.length > 0}>
        <Callout tone="critical" title="Some of that did not work" body={notes?.errors?.join(' ')} />
      </Show>
      <Show when={notes?.warnings !== undefined && notes.warnings.length > 0}>
        <Callout tone="caution" title="Worth a look" body={notes?.warnings?.join(' ')} />
      </Show>
      <Show when={notes?.assumptions !== undefined && notes.assumptions.length > 0}>
        <Callout tone="info" title="We guessed at these" body={notes?.assumptions?.join(' ')} />
      </Show>

      <Repeat each={[...drafts]}>
        {(draft: StockDraft) => (
          <div key={draft.key} className="rounded-blade border border-line bg-white p-4">
            <div className="flex items-start gap-3">
              <KoboyoIcon name={draft.icon as never} size={28} className="mt-0.5 shrink-0" alone />

              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-md font-extrabold text-ink">{draft.name}</p>
                <Show when={draft.recognised === false}>
                  <p className="text-xs text-ink-3">Not one we know — saved as you typed it</p>
                </Show>
                <Show when={draft.confidence !== undefined && draft.confidence < 0.6}>
                  <p className="text-xs text-caution-onsoft">We were not sure we read this right</p>
                </Show>
              </div>

              <IconButton
                icon="trash"
                label={`Remove ${draft.name}`}
                size="sm"
                onClick={() => {
                  onRemove(draft.key);
                }}
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-overline text-ink-3">
                  How much?
                </span>
                <div className="flex items-center gap-2">
                  <IconButton
                    icon="minus"
                    label={`Less ${draft.name}`}
                    onClick={() => {
                      // Floors at a half rather than zero: zero here means
                      // "remove it", and the trash button already says that.
                      onChange(draft.key, { quantity: Math.max(0.5, draft.quantity - 1) });
                    }}
                  />
                  <span className="w-14 text-center font-mono text-lg font-extrabold text-ink">
                    {draft.quantity % 1 === 0 ? draft.quantity : draft.quantity.toFixed(1)}
                  </span>
                  <IconButton
                    icon="plus"
                    label={`More ${draft.name}`}
                    onClick={() => {
                      onChange(draft.key, { quantity: draft.quantity + 1 });
                    }}
                  />
                </div>
              </div>

              <div>
                <Select
                  label="Measured in"
                  value={draft.unit}
                  onValueChange={(unit) => {
                    if (unit === '__add__') {
                      onAddUnit();
                      return;
                    }
                    onChange(draft.key, { unit });
                  }}
                  options={[
                    ...draft.units.map((unit) => ({ value: unit, label: unit })),
                    ...customUnits.map((unit) => ({
                      value: unit.label,
                      label: `${unit.label} (yours)`,
                    })),
                    { value: '__add__', label: '+ Add a unit of your own…' },
                  ]}
                />
                <Show when={UNIT_HINTS[draft.unit] !== undefined}>
                  <p className="mt-1 text-xs text-ink-3">{UNIT_HINTS[draft.unit]}</p>
                </Show>
              </div>
            </div>
          </div>
        )}
      </Repeat>

      <Show when={drafts.length === 0}>
        <div className="rounded-blade border border-dashed border-line py-10 text-center">
          <KoboyoIcon name="emptyBox" size={48} className="text-ink-3" alone />
          <p className="mt-3 text-sm text-ink-2">Nothing to confirm yet.</p>
        </div>
      </Show>

      <Button variant="tertiary" onClick={onAddUnit}>
        Add a unit of your own
      </Button>
    </div>
  );
}
