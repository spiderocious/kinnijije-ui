import { KoboyoIcon, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';

/**
 * The illustration panel beside the auth form, on desktop only.
 *
 * Composed from the icon set rather than a bitmap: it is theme-correct, weighs
 * nothing, and never ships a blurry asset. Real cooked-food photography
 * replaces the tiles later — the panel's shape is built to take them.
 */

/**
 * The palette here is the FOOD TINTS (dish/greens/berry), never the semantic
 * enum. `critical` on a pepper tile would read as an error, and `grape` is
 * reserved for AI provenance — neither means anything about food.
 */
interface Tile {
  readonly icon: KoboyoIconName;
  readonly label: string;
  /** Tailwind grid spans — the deliberately uneven, hand-laid arrangement. */
  readonly span: string;
  readonly tone: string;
}

const TILES: readonly Tile[] = [
  { icon: 'plateJollofRice', label: 'Jollof rice', span: 'col-span-2 row-span-2', tone: 'bg-dish-fill text-dish-line' },
  { icon: 'potStew', label: 'Egusi', span: 'col-span-1 row-span-1', tone: 'bg-greens-fill text-greens-line' },
  { icon: 'basketChillies', label: 'Atarodo', span: 'col-span-1 row-span-1', tone: 'bg-berry-fill text-berry-line' },
  { icon: 'marketStall', label: 'The market', span: 'col-span-1 row-span-1', tone: 'bg-greens-fill text-greens-line' },
  { icon: 'mortarPestle', label: 'Pounding', span: 'col-span-1 row-span-1', tone: 'bg-berry-fill text-berry-line' },
  { icon: 'fryingPan', label: 'On the hob', span: 'col-span-2 row-span-1', tone: 'bg-dish-fill text-dish-line' },
];

export function AuthArt() {
  return (
    <aside
      // Hidden on phones — a decorative panel must never push the form below
      // the fold on the screen most people sign in from.
      className="relative hidden overflow-hidden bg-paper-2 lg:block"
      aria-hidden="true"
    >
      <div className="flex h-full flex-col justify-center px-12 py-16 xl:px-16">
        <div className="grid grid-cols-3 gap-3">
          {TILES.map((tile) => (
            <div
              key={tile.icon}
              // Both class strings are written out in full in TILES above —
              // Tailwind scans source text, so a class it never sees literally
              // is a class it never generates.
              className={cn(
                'flex flex-col items-center justify-center gap-2 rounded-blade p-5',
                tile.span,
                tile.tone,
              )}
            >
              <KoboyoIcon name={tile.icon} size={tile.span.includes('row-span-2') ? 64 : 36} alone />
              <span className="text-center text-xs font-extrabold">{tile.label}</span>
            </div>
          ))}
        </div>

        <p className="mt-8 max-w-[380px] font-display text-xl font-extrabold leading-snug tracking-display text-ink">
          Tell us what is in your kitchen. We will tell you what to cook.
        </p>
        <p className="mt-2 max-w-[380px] text-sm text-ink-2">
          No counting, no spreadsheets — just the food you already have.
        </p>
      </div>
    </aside>
  );
}
