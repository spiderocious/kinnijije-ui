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
 * The last step: what is actually in the kitchen right now.
 *
 * Typing is the primary path and always works. Photo and voice are shown as
 * what is coming rather than hidden, because the product's whole promise is
 * "three ways in" and pretending otherwise would misrepresent it — but they are
 * plainly marked as not ready, never as a button that silently does nothing.
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
          What is in your kitchen?
        </h1>
        <p className="mt-2 text-md text-ink-2">
          Whatever is there right now. You are not making a list to keep — you will be asked
          again next time.
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

      {/* Shown, not hidden — but honest that it is not wired yet. A button
          that looks live and does nothing is worse than one that says so. */}
      <Callout
        tone="neutral"
        title="Photo and voice are coming"
        body="Soon you will be able to photograph a shelf or a receipt, or just say what you have, and have it read for you. For now, typing is the way in."
      />

      <div className="flex items-center justify-center gap-6 text-ink-3">
        <span className="flex items-center gap-1.5 text-xs">
          <KoboyoIcon name="takingPhotoCamera" size={16} alone /> Photo
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <KoboyoIcon name="mic" size={16} alone /> Voice
        </span>
        <span className="flex items-center gap-1.5 text-xs font-extrabold text-sky">
          <KoboyoIcon name="editPencil" size={16} alone /> Typing
        </span>
      </div>
    </div>
  );
}
