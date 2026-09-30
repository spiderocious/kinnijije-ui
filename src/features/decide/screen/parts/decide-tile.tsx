import { Check } from 'lucide-react';

import { KoboyoIcon, type KoboyoIconName } from '@ui/icons';

/**
 * The workhorse of the whole flow.
 *
 * A real <button> with aria-pressed, never a styled div — the flow is
 * tap-driven, so every tap target has to be reachable by keyboard and
 * announced by a screen reader.
 *
 * Selection is never carried by colour alone: a picked tile takes the sky
 * fill AND a tick badge on the blade's sharp corner, so it reads as stamped
 * rather than merely tinted.
 */
interface DecideTileProps {
  readonly label: string;
  readonly caption?: string | undefined;
  readonly icon?: string | undefined;
  /**
   * A drawn illustration for this tile, when one exists.
   *
   * Takes precedence over the glyph. It cannot recolour on selection the way
   * `currentColor` does, so the SELECTED state is carried by the fill, the
   * border and the tick badge instead, which it already was.
   */
  readonly art?: string | undefined;
  readonly selected: boolean;
  readonly onToggle: () => void;
  /** Wide tiles put the art beside the label, for the weight step. */
  readonly wide?: boolean;
  readonly big?: boolean;
}

export function DecideTile({
  label,
  caption,
  icon,
  art,
  selected,
  onToggle,
  wide = false,
  big = false,
}: DecideTileProps) {
  const artSize = big ? 56 : wide ? 34 : 44;

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={[
        'relative flex cursor-pointer items-center rounded-blade-xs border-2 font-sans font-bold',
        'transition-all duration-fast ease-kj-out',
        wide ? 'flex-row gap-3 px-4 py-3 text-left' : 'flex-col justify-center gap-2 px-2 py-3 text-center',
        selected
          ? 'border-sky bg-sky-soft text-sky-on shadow-drop-sm'
          : 'border-line-2 bg-white text-ink-2 hover:-translate-y-0.5 hover:border-ink',
      ].join(' ')}
    >
      {art !== undefined ? (
        <img
          src={art}
          alt=""
          width={artSize}
          height={artSize}
          loading="lazy"
          className="shrink-0 object-contain"
          style={{ width: artSize, height: artSize }}
        />
      ) : (
        icon !== undefined && (
          <KoboyoIcon
            name={icon as KoboyoIconName}
            size={artSize}
            className={['shrink-0', selected ? 'text-sky-deep' : 'text-ink-2'].join(' ')}
          />
        )
      )}

      <span className={wide ? '' : 'contents'}>
        <span className="block text-[12.5px] leading-tight">{label}</span>
        {caption !== undefined && (
          <span
            className={[
              'mt-0.5 block text-[10.5px] font-bold',
              selected ? 'text-sky-deep' : 'text-ink-4',
            ].join(' ')}
          >
            {caption}
          </span>
        )}
      </span>

      {selected && (
        <span
          aria-hidden="true"
          className="absolute -right-[7px] -top-[7px] grid h-[22px] w-[22px] place-items-center rounded-round border-2 border-ink bg-sky"
        >
          <Check size={13} strokeWidth={3.4} className="text-white" />
        </span>
      )}
    </button>
  );
}
