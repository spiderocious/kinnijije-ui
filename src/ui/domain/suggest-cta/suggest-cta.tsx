import { BlobThinking, KoboyoIcon } from '@icons';
import { cn } from '@shared/utils/cn';
import { Button } from '@ui/primitives';

/**
 * The funnel's single commit.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/31-suggest-cta.html
 *
 * The product's ONE unified primary. Every path through the kitchen screen ends
 * here, so it is a named component rather than a button with a label — that way
 * its disabled reason, its count and its loading copy can never diverge between
 * the three capture methods (type, voice, photo).
 *
 * There is deliberately no `label` prop: the copy is owned here.
 *
 * **A silent disabled CTA is a bug report.** `disabledReason` is required
 * whenever the CTA is not actionable, and the type makes that structural — the
 * disabled states are modelled as a discriminated union, so a disabled CTA with
 * no reason will not compile.
 */

interface SuggestCTABase {
  /** How many things are in the basket. Drives the label. */
  readonly ingredientCount: number;
  readonly onSuggest?: () => void;
  readonly className?: string;
}

type SuggestCTAState =
  | { readonly state?: 'ready' }
  | { readonly state: 'loading' }
  /** Not actionable — the reason is REQUIRED and always rendered. */
  | { readonly state: 'disabled'; readonly disabledReason: string }
  /** The AI feature flag is off. */
  | {
      readonly state: 'featureDisabled';
      readonly disabledReason: string;
      readonly disabledDetail?: string;
    }
  /** The engine failed. The basket is kept. */
  | { readonly state: 'error'; readonly errorMessage: string };

export type SuggestCTAProps = SuggestCTABase & SuggestCTAState;

export function SuggestCTA(props: SuggestCTAProps) {
  const { ingredientCount, onSuggest, className } = props;

  // Narrow on `props` itself — a `state` local copied out of the union does not
  // carry the discriminant back to the sibling fields.
  if (props.state === 'loading') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        <BlobThinking size={72} label="Finding you three meals" />
        <p className="font-display text-lg font-extrabold tracking-display">
          Finding you three meals…
        </p>
      </div>
    );
  }

  if (props.state === 'error') {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <Button fullWidth size="lg" icon="cycle" onClick={onSuggest}>
          Try again
        </Button>
        <p className="flex items-center gap-2 text-sm font-extrabold text-critical-onsoft">
          <KoboyoIcon name="error" size={15} />
          {props.errorMessage}
        </p>
      </div>
    );
  }

  if (props.state === 'featureDisabled') {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <Button fullWidth size="lg" disabled>
          Suggest meals
        </Button>
        <div className="rounded-blade-xs border border-neutral-border bg-neutral-soft px-3 py-2">
          <p className="text-sm font-extrabold text-neutral-onsoft">{props.disabledReason}</p>
          {props.disabledDetail !== undefined && (
            <p className="mt-1 text-sm text-ink-2">{props.disabledDetail}</p>
          )}
        </div>
      </div>
    );
  }

  if (props.state === 'disabled') {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <Button fullWidth size="lg" disabled>
          Suggest meals
        </Button>
        {/* The reason is visible, not implied. */}
        <p className="text-sm font-extrabold text-ink-3">{props.disabledReason}</p>
      </div>
    );
  }

  return (
    <Button
      fullWidth
      size="lg"
      icon="cookingPot"
      onClick={onSuggest}
      className={className}
    >
      {ingredientCount > 0 ? (
        <>
          Suggest meals from <span className="font-mono tnum">{ingredientCount}</span>{' '}
          {ingredientCount === 1 ? 'thing' : 'things'}
        </>
      ) : (
        'Suggest meals'
      )}
    </Button>
  );
}
