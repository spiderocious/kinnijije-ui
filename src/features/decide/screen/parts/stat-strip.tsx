import { KoboyoIcon, type KoboyoIconName } from '@ui/icons';

import { useDecideStats } from '../../hooks/use-decide-stats';

/**
 * What the product has actually done.
 *
 * EXACTLY WHAT THE SERVER SAID, and nothing else. These used to creep upward
 * between fetches — a drift derived from the snapshot's timestamp, with the
 * display animating one number at a time to keep up. It was removed because
 * the number on screen was no longer the number anybody had counted: it was a
 * real figure plus an invented amount, and no reader could tell which part was
 * which.
 *
 * Nothing persisted the drifted value, so there is nothing to clear. It was
 * recomputed from `as_of` on every render, which is why it appeared to survive
 * a reload — removing the derivation removes it outright.
 *
 * Rendered as cards rather than bare numbers: three unlabelled figures in a row
 * read as a spec sheet, and a bordered tile with its own mark reads as a fact
 * about people. Each carries a koboyo glyph in its own food tint, so the strip
 * has the same drawn character as the rest of the flow.
 */
interface StatDef {
  readonly key: 'decided' | 'today' | 'cooked';
  readonly label: string;
  readonly icon: KoboyoIconName;
  /** A food tint, never a status colour: these are not a severity. */
  readonly tint: string;
  readonly ink: string;
}

const STATS: readonly StatDef[] = [
  {
    key: 'decided',
    label: 'meals decided',
    icon: 'potStew',
    tint: 'bg-dish-fill',
    ink: 'text-dish-line',
  },
  // {
  //   key: 'cooked',
  //   label: 'actually cooked',
  //   icon: 'chefHat',
  //   tint: 'bg-greens-fill',
  //   ink: 'text-greens-line',
  // },
  {
    key: 'today',
    label: 'sorted today',
    icon: 'alarmClock',
    tint: 'bg-sky-soft',
    ink: 'text-sky-deep',
  }
];

export function StatStrip() {
  const { data } = useDecideStats();

  /*
   * Straight from the response. No clamping either: the counters used to
   * drift at independent rates, which could put "sorted today" above "meals
   * decided" — an impossible pair that had to be corrected in the UI. Server
   * counts cannot contradict each other, so there is nothing left to correct.
   */
  const values: Record<StatDef['key'], number | undefined> = {
    decided: data?.meals_decided,
    today: data?.decided_today,
    cooked: data?.meals_cooked,
  };

  // Decoration. If the counters cannot load, the page is fine without them —
  // and a row of skeletons above the CTA would be worse than nothing.
  if (data === undefined) return null;

  return (
    <dl className="grid w-full max-w-[440px] grid-cols-2 gap-2">
      {STATS.map((stat) => {
        const value = values[stat.key];
        if (value === undefined) return null;

        return (
          <div
            key={stat.key}
            className="flex flex-col items-center gap-1.5 rounded-blade-xs border-hair border-line-2 bg-white px-1.5 py-3"
          >
            <span
              className={[
                'grid h-8 w-8 place-items-center rounded-round border-hair border-ink/10',
                stat.tint,
              ].join(' ')}
              aria-hidden="true"
            >
              <KoboyoIcon name={stat.icon} size={17} className={stat.ink} />
            </span>

            <dd className="m-0 font-display text-[21px] font-extrabold leading-none text-ink tnum sm:text-[24px]">
              {value.toLocaleString()}
            </dd>

            <dt className="text-center text-[10px] font-bold uppercase leading-tight tracking-label text-ink-3">
              {stat.label}
            </dt>
          </div>
        );
      })}
    </dl>
  );
}
