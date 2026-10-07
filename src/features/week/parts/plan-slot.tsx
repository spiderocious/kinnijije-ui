import { Show } from 'meemaw';

import { KOBOYO_GLYPHS, KoboyoIcon, MoreVertical, Plus, type KoboyoIconName } from '@icons';

import { PlanTag } from './plan-chrome';

/**
 * A recipe's `heroIcon`, checked against the glyphs that actually exist.
 *
 * `KoboyoIcon` renders an EMPTY BOX for a name it does not know rather than
 * falling back, so passing an unvetted string straight through would leave a
 * blank square where the dish mark should be — for any recipe whose glyph was
 * renamed or removed. Checking here means the generic plate shows instead.
 */
export function dishGlyph(heroIcon: string | null | undefined): KoboyoIconName {
  if (heroIcon !== null && heroIcon !== undefined && heroIcon in KOBOYO_GLYPHS) {
    return heroIcon as KoboyoIconName;
  }
  return 'plateFull';
}

/**
 * A meal slot — `.slot` from frame 03.
 *
 * "A day is a column, not a slot": a real Tuesday has lunch AND dinner, and
 * sometimes breakfast too, so the day renders a list of these rather than two
 * fixed boxes. The `Add a meal` control below is the other half of that.
 *
 * The per-slot menu is for swap / replace / remove; per-day regenerate lives
 * in the app bar. Two scopes, two controls — never one button doing both.
 */
export function PlanSlot({
  slotName,
  minutes,
  dishName,
  heroIcon,
  reason,
  tags,
  onMenu,
}: {
  readonly slotName: string;
  readonly minutes: number | null;
  readonly dishName: string;
  /**
   * The recipe's own glyph, so the mark says which dish rather than "a dish".
   *
   * A string rather than the icon union, because it arrives from the API —
   * `KoboyoIcon` falls back on a name it does not know, which is the right
   * behaviour for a recipe whose glyph was set before that icon existed.
   */
  readonly heroIcon?: string | null;
  /** The one-line reason. Written by the model, per the spec. */
  readonly reason: string | null;
  readonly tags: readonly { label: string; tone: 'neutral' | 'ok' | 'warn' | 'crit' }[];
  readonly onMenu: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-blade-sm border-2 border-ink bg-white shadow-drop-sm">
      <div className="flex items-center gap-[7px] border-b border-hair border-line bg-paper-2 px-[11px] py-[7px]">
        <span className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-ink-3">
          {slotName}
        </span>
        <Show when={minutes !== null}>
          <span className="ml-auto font-mono text-[10px] font-semibold text-ink-4">
            {minutes} min
          </span>
        </Show>
        <button
          type="button"
          onClick={onMenu}
          aria-label={`Edit ${dishName}`}
          className={`grid h-6 w-6 place-items-center rounded text-ink-3 hover:bg-white hover:text-ink ${
            minutes === null ? 'ml-auto' : ''
          }`}
        >
          <MoreVertical size={14} strokeWidth={2.6} />
        </button>
      </div>

      <div className="flex items-start gap-2.5 px-[11px] py-2.5">
        {/* `.sart` — the dish mark. A koboyo glyph rather than a photo: the
            plan is a list of decisions, and thumbnails would make it a menu. */}
        <div className="grid h-[46px] w-[46px] flex-none place-items-center rounded-blade-xs border border-hair border-line-2 bg-sky-soft">
          <KoboyoIcon name={dishGlyph(heroIcon)} size={30} alone />
        </div>
        <div className="min-w-0">
          <div className="font-display text-[15px] font-extrabold leading-[1.15] text-ink">
            {dishName}
          </div>
          <Show when={reason !== null}>
            <div className="mt-[3px] text-[11.5px] text-ink-3">{reason}</div>
          </Show>
        </div>
      </div>

      <Show when={tags.length > 0}>
        <div className="flex flex-wrap gap-[5px] px-[11px] pb-2.5">
          {tags.map((tag) => (
            <PlanTag key={tag.label} tone={tag.tone}>
              {tag.label}
            </PlanTag>
          ))}
        </div>
      </Show>
    </div>
  );
}

/**
 * `.addslot` — the dashed "Add a meal to Tuesday".
 *
 * Exists because a real day sometimes has three meals, and a plan that cannot
 * express that gets abandoned.
 */
export function PlanAddSlot({
  dayName,
  onClick,
}: {
  readonly dayName: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-[7px] rounded-blade-xs border border-hair border-dashed border-line-2 p-[11px] text-[12.5px] font-extrabold text-ink-3 hover:border-ink hover:bg-white hover:text-ink"
    >
      <Plus size={15} strokeWidth={2.6} />
      Add a meal to {dayName}
    </button>
  );
}
