import { KoboyoIcon, type KoboyoIconName } from '@ui/icons';
import { cn } from '@shared/utils/cn';

/**
 * One choice in the dock.
 *
 * Built for Ask rather than borrowed from the tap flow: that one is sized for a
 * full-screen grid with room to breathe, and a dock has neither. This is
 * shorter, denser, and it carries its own arrival animation because tiles here
 * appear a stage at a time rather than once per screen.
 *
 * Illustration when we have one, koboyo glyph when we do not. The fallback is a
 * real design decision, not a gap: a hand-drawn glyph beside an illustration
 * reads as a set, where a missing image reads as broken.
 */
/** The mood tile's picture size, for illustrations and glyphs both. */
const MOOD_ART_PX = 24;

interface AskTileProps {
  readonly label: string;
  readonly caption?: string | undefined;
  readonly icon?: string | undefined;
  readonly art?: string | undefined;
  readonly selected?: boolean;
  readonly big?: boolean;
  /** Position in the grid, which sets the arrival delay. */
  readonly index?: number;
  readonly onToggle: () => void;
}

export function AskTile({
  label,
  caption,
  icon,
  art,
  selected = false,
  big = false,
  index = 0,
  onToggle,
}: AskTileProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        'kj-tile-in group relative flex flex-col items-center justify-center gap-1 rounded-blade-xs border-2 bg-white text-center',
        'transition-all duration-fast ease-kj-out active:scale-[.95]',
        // Spec: 9px/5px padding, and hover lifts rather than only outlining.
        big ? 'min-h-[84px] px-[5px] py-[9px]' : 'min-h-[62px] px-[5px] py-[9px]',
        selected
          ? 'border-sky bg-sky-100 text-sky-on shadow-drop-sm'
          : 'border-line-2 text-ink-2 hover:-translate-y-0.5 hover:border-ink',
      )}
      // The staircase: 35ms apart is enough to read as a sequence and short
      // enough that a twelve-tile grid still lands in under half a second.
      style={{ animationDelay: `${String(index * 35)}ms` }}
    >
      {/* The big (mood) tile draws its picture at 24px — illustration and
          fallback glyph ALIKE. They used to be 44 and 28, so a mood with an
          illustration sat visibly larger than one without, and the row read
          as two different kinds of tile. One size makes it a set; a fixed
          box, so a wide illustration cannot grow past it. */}
      {art !== undefined ? (
        <img
          src={art}
          alt=""
          width={big ? MOOD_ART_PX : 30}
          height={big ? MOOD_ART_PX : 30}
          className={cn('object-contain', big ? 'h-6 w-6' : 'h-auto w-[30px]')}
          loading="lazy"
        />
      ) : icon !== undefined ? (
        <KoboyoIcon name={icon as KoboyoIconName} size={big ? MOOD_ART_PX : 20} className="text-ink-2" />
      ) : null}

      <span
        className={cn(
          'w-full truncate font-bold leading-tight',
          big ? 'text-[11.5px]' : 'text-[11px]',
        )}
      >
        {label}
      </span>

      {caption !== undefined && big && (
        <span className="w-full truncate text-[9.5px] font-bold text-ink-4">{caption}</span>
      )}
    </button>
  );
}
