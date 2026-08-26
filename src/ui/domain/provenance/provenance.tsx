import { cn } from '@shared/utils/cn';

/**
 * The provenance pair — one fact, one label.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/290-provenance-pair.html
 *                                                          127-status-recipe-source.html
 *
 * **The single most important contract in this system.** Verified and AI,
 * rendered identically everywhere. In the shipped app the same recipe read
 * "✓ Verified", "Verified recipe" and "✓ Verified" across three consecutive
 * screens — three labels for one fact.
 *
 * **The label string is owned here.** No screen may render its own variant.
 *
 * This is a REQUIRED slot on `Meal.Root`: a meal card without a provenance tag
 * does not render at all, which makes the three-different-labels bug
 * structurally impossible rather than merely discouraged.
 *
 * An unknown source renders CRITICAL, loudly — a recipe without provenance is a
 * data bug, not a neutral absence.
 */

export type RecipeSource = 'seed' | 'ai';

/** The label strings. Owned here, forever. */
const SOURCE_LABEL: Record<RecipeSource, string> = {
  seed: '✓ Verified',
  ai: '◆ Made by AI',
};

const SOURCE_CLASS: Record<RecipeSource, string> = {
  // Green — a human wrote and tested this.
  seed: 'bg-success-soft text-success-onsoft border-success-border',
  // Grape — machine-made. Deliberately NOT caution: being AI-written is not a
  // warning, it is a different kind of claim.
  ai: 'bg-grape-soft text-grape-onsoft border-grape-border',
};

export interface ProvenanceProps {
  /**
   * Where the recipe came from. `undefined` is a data bug and renders as one.
   */
  readonly source: RecipeSource | undefined;
  readonly size?: 'sm' | 'md';
  readonly className?: string;
}

export function Provenance({ source, size = 'md', className }: ProvenanceProps) {
  const base = cn(
    'inline-flex items-center gap-1 whitespace-nowrap rounded-blade-xs border font-extrabold',
    size === 'sm' ? 'px-2 py-[2px] text-xs' : 'px-[10px] py-1 text-sm',
    className,
  );

  // A recipe with no provenance is a bug — it says so rather than staying quiet.
  if (source === undefined) {
    return (
      <span
        className={cn(base, 'bg-critical-soft text-critical-onsoft border-critical-border')}
        title="This recipe has no source recorded. Report it."
      >
        Unknown provenance — report this
      </span>
    );
  }

  return <span className={cn(base, SOURCE_CLASS[source])}>{SOURCE_LABEL[source]}</span>;
}

/** A skeleton at the provenance tag's true measure. */
export function ProvenanceSkeleton({ size = 'md' }: { readonly size?: 'sm' | 'md' }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block animate-shimmer rounded-blade-xs bg-paper-2',
        size === 'sm' ? 'h-[20px] w-[86px]' : 'h-[26px] w-[104px]',
      )}
    />
  );
}

/**
 * Whether this source's figures are estimates. Derived, never passed
 * separately — that is what stops a card claiming "Verified" beside a padded
 * time, or "Made by AI" beside an unmarked one.
 */
export function isApproximate(source: RecipeSource | undefined): boolean {
  return source === 'ai';
}
