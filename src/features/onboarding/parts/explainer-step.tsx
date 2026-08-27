import { KoboyoIcon } from '@icons';
import { Provenance } from '@ui/domain';
import { Card } from '@ui/structure';
import { Show } from 'meemaw';

import type { ExplainerSlide } from '../content/onboarding.content';

/**
 * One explainer slide.
 *
 * A carousel in the sense that it advances one at a time under the same
 * progress header — not a swipe-and-hope carousel with hidden content. Each
 * slide is a real step, so nothing is missed by not swiping.
 */
export function ExplainerStep({
  slide,
  showProvenance,
}: {
  readonly slide: ExplainerSlide;
  /** The trust slide shows the actual badges, not a description of them. */
  readonly showProvenance: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <KoboyoIcon name={slide.icon} size={72} className="text-sky" alone />

      <h1 className="font-display text-2xl font-extrabold leading-tight tracking-display sm:text-3xl">
        {slide.title}
      </h1>

      <p className="max-w-[46ch] text-md leading-relaxed text-ink-2">{slide.body}</p>

      <Show when={showProvenance}>
        <Card variant="quiet" className="w-full max-w-[420px] text-left">
          <p className="text-sm font-extrabold text-ink">Every recipe carries its source</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Provenance source="seed" size="sm" />
            <Provenance source="ai" size="sm" />
          </div>
          <p className="mt-3 text-sm text-ink-2">
            Tested by a person, or written by a model with the quantities marked as estimates.
          </p>
        </Card>
      </Show>
    </div>
  );
}
