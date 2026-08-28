import { Repeat, Show } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { ChipInput, type ChipItem } from '@ui/inputs';
import { Callout } from '@ui/feedback';
import { PillButton } from '@ui/primitives';

import { COMMON_INGREDIENTS } from '../content/onboarding.content';

interface KitchenStepProps {
  readonly items: readonly string[];
  readonly onAdd: (label: string) => void;
  readonly onRemove: (label: string) => void;
}

/**
 * The last step: EXPLAINING the kitchen, and offering a head start on it.
 *
 * This used to demand a list before it would let anybody through, which is
 * backwards — somebody who has not seen the product yet does not know what
 * they are filling in or why. So it explains what the kitchen is FOR, offers a
 * few taps as a shortcut, and lets them past either way.
 */
export function KitchenStep({ items, onAdd, onRemove }: KitchenStepProps) {
  // `source` is required: the design tracks where every chip came from, and
  // during onboarding everything is typed or tapped by the person themselves.
  const chips: ChipItem[] = items.map((label) => ({ id: label, label, source: 'typed' }));
  const suggestions = COMMON_INGREDIENTS.filter((name) => !items.includes(name)).slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold leading-tight tracking-display sm:text-3xl">
          Your kitchen is how this works
        </h1>
        <p className="mt-2 text-md text-ink-2">
          Everything here starts from what you actually have. Once your kitchen knows a few
          things, it can tell you what you could cook tonight — and it keeps itself current as
          you cook and shop, so you are never counting anything.
        </p>
        <p className="mt-3 text-md text-ink-2">
          You can add things any time from the <b>Stock</b> page — by typing, by photographing a
          shelf, or from a market receipt. If you want a head start, drop a few in now.
        </p>
      </header>

      <ChipInput
        label="Your ingredients"
        items={chips}
        onAdd={onAdd}
        onRemove={onRemove}
        placeholder="Rice, tomatoes, chicken…"
      />

      <Show when={suggestions.length > 0}>
        <section>
          <h2 className="mb-2 text-xs font-extrabold uppercase tracking-overline text-ink-3">
            Common in a Nigerian kitchen
          </h2>
          <div className="flex flex-wrap gap-2">
            <Repeat each={suggestions}>
              {(name: string) => (
                <PillButton
                  key={name}
                  onClick={() => {
                    onAdd(name);
                  }}
                >
                  + {name}
                </PillButton>
              )}
            </Repeat>
          </div>
        </section>
      </Show>

      {/* This said photo and voice were "coming" — photo and receipts have
          shipped since, and telling somebody a working feature does not exist
          is the one kind of wrong a first-run screen cannot afford. */}
      <Callout
        tone="neutral"
        title="Nothing to fill in now"
        body="Skip this if you like. The Stock page takes typing, a photo of a shelf, or a market receipt — whichever is easiest when you get to it."
      />

      <div className="flex items-center justify-center gap-6 text-ink-3">
        <span className="flex items-center gap-1.5 text-xs">
          <KoboyoIcon name="takingPhotoCamera" size={16} alone /> Photograph a shelf
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <KoboyoIcon name="receipt" size={16} alone /> Read a receipt
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <KoboyoIcon name="editPencil" size={16} alone /> Type it
        </span>
      </div>
    </div>
  );
}
