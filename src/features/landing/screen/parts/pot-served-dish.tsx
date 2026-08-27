import { Repeat } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { cn } from '@shared/utils/cn';
import { Button } from '@ui/primitives';

import { POT_ANCHOR } from '../../helpers/pot-choreography';

/** What the dish claims. Every line is checkable against the ingredients flown in. */
const SERVED_LINES = [
  { icon: 'tick', text: 'Uses 7 of the 8 things you have' },
  { icon: 'alarmClock', text: 'About 35 minutes, one pot' },
  { icon: 'basket', text: 'Nothing to buy' },
] as const;

interface PotServedDishProps {
  readonly onStart: () => void;
}

/**
 * The payoff — what rises out of the pot in Act V.
 *
 * Anchored to the SAME point as the pot, so the emergence reads as one motion
 * rather than a card appearing near a pot. The timeline lifts it from `y: 150`
 * inside the pot to rest.
 *
 * It carries a real provenance badge because the system's provenance contract
 * says any component rendering a recipe renders its source — a marketing page
 * is not exempt. The badge here says `✓ Verified` and means it: seed recipes are
 * the ones a person cooked and tested, and that is the product's actual moat.
 */
export function PotServedDish({ onStart }: PotServedDishProps) {
  return (
    <div
      data-served-dish
      className={cn(
        'absolute z-20 w-[340px] -translate-x-1/2 -translate-y-1/2',
        // Hidden at rest ONLY where the theatre runs; static layouts show it.
        'opacity-0 lg:motion-safe:opacity-0',
        'max-lg:opacity-100 motion-reduce:opacity-100',
      )}
      style={{ left: `${POT_ANCHOR.x - 14}%`, top: `${POT_ANCHOR.y - 6}%` }}
    >
      <article className="relative rounded-blade-lg border-bold border-ink bg-white shadow-drop-lg">
        {/* The provenance stamp. Success tone — a person tested this. */}
        <span
          data-served-badge
          className="absolute -right-3 -top-3 z-10 rounded-blade-xs border-bold border-ink bg-success-soft px-3 py-1 text-sm font-extrabold text-success-onsoft shadow-drop-sm"
        >
          ✓ Verified
        </span>

        {/* The dish itself. A drawn mark, honest about being a stand-in. */}
        <div className="grid h-40 place-items-center rounded-t-blade-lg border-b-bold border-ink bg-dish-fill text-dish-line">
          <KoboyoIcon name="potStew" size={78} alone />
        </div>

        <div className="flex flex-col gap-3 p-4">
          <h3 className="font-display text-2xl font-extrabold leading-tight tracking-display">
            Jollof rice with fried plantain
          </h3>

          <ul className="flex flex-col gap-2">
            <Repeat each={SERVED_LINES as unknown as (typeof SERVED_LINES)[number][]}>
              {(line: (typeof SERVED_LINES)[number]) => (
                <li
                  key={line.text}
                  data-served-line
                  className="flex items-center gap-2 text-sm font-semibold text-ink-2"
                >
                  <KoboyoIcon name={line.icon} size={16} className="text-success" />
                  {line.text}
                </li>
              )}
            </Repeat>
          </ul>

          <div data-served-cta className="mt-1">
            <Button size="lg" className="w-full" onClick={onStart}>
              Cook this tonight
            </Button>
          </div>
        </div>
      </article>
    </div>
  );
}
