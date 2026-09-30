import { KoboyoIcon, type KoboyoIconName } from '@ui/icons';

import { useDecideStats } from '../../hooks/use-decide-stats';
import { TICK_SALTS, useLiveStat } from '../../hooks/use-live-stat';
import { CountUp } from './count-up';

/**
 * What the product has actually done.
 *
 * Three counters, each from a real server-side count, each creeping upward
 * from the snapshot's own timestamp so a reload lands where it left off rather
 * than jumping backwards.
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
  {
    key: 'today',
    label: 'sorted today',
    icon: 'alarmClock',
    tint: 'bg-sky-soft',
    ink: 'text-sky-deep',
  },
  {
    key: 'cooked',
    label: 'actually cooked',
    icon: 'chefHat',
    tint: 'bg-greens-fill',
    ink: 'text-greens-line',
  },
];

export function StatStrip() {
  const { data } = useDecideStats();

  const decided = useLiveStat(data?.meals_decided, data?.as_of, TICK_SALTS.decided);
  const today = useLiveStat(data?.decided_today, data?.as_of, TICK_SALTS.today);
  const cooked = useLiveStat(data?.meals_cooked, data?.as_of, TICK_SALTS.cooked);

  const values: Record<StatDef['key'], number | undefined> = { decided, today, cooked };

  // Decoration. If the counters cannot load, the page is fine without them —
  // and a row of skeletons above the CTA would be worse than nothing.
  if (data === undefined) return null;

  return (
    <dl className="grid w-full max-w-[440px] grid-cols-3 gap-2">
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
              <CountUp value={value} />
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
