import { useEffect, useRef, useState } from 'react';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Repeat, Show } from 'meemaw';

import { KoboyoIcon, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';

gsap.registerPlugin(useGSAP);

interface DemoIngredient {
  readonly label: string;
  readonly icon: KoboyoIconName;
}

/** What the demo "types". A real Nigerian weeknight shelf. */
const TYPED: readonly DemoIngredient[] = [
  { label: 'rice', icon: 'bagRice' },
  { label: 'tomatoes', icon: 'tomato' },
  { label: 'onions', icon: 'onion' },
  { label: 'scotch bonnet', icon: 'chilli' },
  { label: 'chicken', icon: 'chickenCoop' },
];

interface DemoMatch {
  readonly dish: string;
  readonly have: number;
  readonly of: number;
  readonly minutes: number;
  readonly verified: boolean;
}

/** What comes back. Ordered by how little you have to buy — the real ranking. */
const MATCHES: readonly DemoMatch[] = [
  { dish: 'Jollof rice', have: 5, of: 5, minutes: 45, verified: true },
  { dish: 'Chicken stew', have: 5, of: 6, minutes: 40, verified: true },
  { dish: 'Fried rice', have: 4, of: 7, minutes: 35, verified: false },
];

const TYPE_SPEED_MS = 62;
const HOLD_MS = 2600;

/**
 * The live demo — the product's core loop, running by itself on the page.
 *
 * A landing page claiming "type what you have and it finds dinner" should show
 * exactly that rather than screenshot it. The ingredients type themselves in,
 * chip by chip; the matches then deal in ranked by how little you need to buy.
 * It loops, so the section is never dead on arrival.
 *
 * The whole cycle is driven by one interval and a small state machine rather
 * than a scroll position, because this section is a *demonstration*, not a
 * scene — it should keep working when the user has stopped scrolling to watch.
 */
export function LiveMatch() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState('');
  const [chips, setChips] = useState<DemoIngredient[]>([]);
  const [showMatches, setShowMatches] = useState(false);

  useEffect(() => {
    // Respect the user's motion setting: show the finished state and stop.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setChips([...TYPED]);
      setShowMatches(true);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const run = async () => {
      const wait = (ms: number) =>
        new Promise<void>((resolve) => {
          timer = setTimeout(resolve, ms);
        });

      // eslint-disable-next-line no-constant-condition
      while (!cancelled) {
        setChips([]);
        setShowMatches(false);
        setTyped('');
        await wait(700);

        for (const item of TYPED) {
          if (cancelled) return;
          // Type the word out, letter by letter.
          for (let i = 1; i <= item.label.length; i += 1) {
            if (cancelled) return;
            setTyped(item.label.slice(0, i));
            await wait(TYPE_SPEED_MS);
          }
          await wait(240);
          if (cancelled) return;
          // Commit it as a chip — the same gesture the real input uses.
          setChips((prev) => [...prev, item]);
          setTyped('');
          await wait(180);
        }

        if (cancelled) return;
        await wait(500);
        setShowMatches(true);
        await wait(HOLD_MS);
      }
    };

    void run();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  // Each new chip pops as it commits; each match deals in.
  useGSAP(
    () => {
      gsap.fromTo(
        '[data-demo-chip]:last-child',
        { scale: 0.6, autoAlpha: 0, y: 8 },
        { scale: 1, autoAlpha: 1, y: 0, duration: 0.32, ease: 'back.out(2.4)' },
      );
    },
    { scope: rootRef, dependencies: [chips.length] },
  );

  useGSAP(
    () => {
      if (!showMatches) return;
      gsap.fromTo(
        '[data-demo-match]',
        { x: 26, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.44, stagger: 0.11, ease: 'power3.out' },
      );
    },
    { scope: rootRef, dependencies: [showMatches] },
  );

  return (
    <section ref={rootRef} className="bg-paper py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-overline text-ink-3">
            Watch it work
          </p>
          <h2 className="mt-3 font-display text-4xl font-extrabold tracking-display sm:text-5xl">
            Five things. One answer.
          </h2>
          <p className="mt-4 max-w-[46ch] text-lg text-ink-2">
            No recipe search, no filters, no scrolling through someone&apos;s life story to reach
            the ingredients. You say what is in the kitchen; it ranks what you can actually cook
            by how little you need to buy.
          </p>

          <ul className="mt-7 flex flex-col gap-3">
            <Repeat
              each={[
                'Ranked by what you already own — not by what is trendy',
                'Every recipe labelled: tested by a person, or made by AI',
                'Works offline, because kitchens have bad signal',
              ]}
            >
              {(line: string) => (
                <li key={line} className="flex items-start gap-3 text-sm font-semibold text-ink-2">
                  <span className="mt-[2px] grid h-5 w-5 shrink-0 place-items-center rounded-round bg-success-soft text-success-onsoft">
                    <KoboyoIcon name="tick" size={12} />
                  </span>
                  {line}
                </li>
              )}
            </Repeat>
          </ul>
        </div>

        {/* ── The demo surface ── */}
        <div className="rounded-blade-xl border-bold border-ink bg-white p-5 shadow-drop-lg">
          <p className="text-xs font-extrabold uppercase tracking-overline text-ink-3">
            What is in your kitchen?
          </p>

          {/* The input, with its chips and a live caret. */}
          <div className="mt-3 min-h-[104px] rounded-blade border border-line-2 bg-paper-2 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Repeat each={chips}>
                {(chip: DemoIngredient) => (
                  <span
                    key={chip.label}
                    data-demo-chip
                    className="inline-flex items-center gap-1.5 rounded-blade-xs border border-ink bg-white px-2.5 py-1.5 text-sm font-extrabold text-ink shadow-drop-sm"
                  >
                    <KoboyoIcon name={chip.icon} size={15} className="text-dish-line" />
                    {chip.label}
                  </span>
                )}
              </Repeat>

              <span className="inline-flex items-center text-sm font-semibold text-ink">
                {typed}
                <span className="ml-[1px] inline-block h-[17px] w-[2px] animate-pulse bg-sky" />
              </span>
            </div>
          </div>

          {/* The answer. */}
          <div className="mt-4 min-h-[188px]">
            <Show
              when={showMatches}
              fallback={
                <p className="flex items-center gap-2 py-6 text-sm font-semibold text-ink-4">
                  <KoboyoIcon name="sparkle" size={16} className="animate-pulse text-sky" />
                  Listening&hellip;
                </p>
              }
            >
              <div className="flex flex-col gap-2">
                <Repeat each={MATCHES as DemoMatch[]}>
                  {(match: DemoMatch) => (
                    <article
                      key={match.dish}
                      data-demo-match
                      className="flex items-center gap-3 rounded-blade border border-line-2 bg-white p-3"
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-blade-xs bg-dish-fill text-dish-line">
                        <KoboyoIcon name="plateFull" size={22} />
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-md font-extrabold tracking-display">
                          {match.dish}
                        </p>
                        <p className="text-xs font-semibold text-ink-3">
                          Uses {match.have} of {match.of} · about {match.minutes} min
                        </p>
                      </div>

                      {/* Provenance travels with the dish. Always. */}
                      <span
                        className={cn(
                          'shrink-0 rounded-blade-xs border px-2 py-1 text-xs font-extrabold',
                          match.verified
                            ? 'border-success-border bg-success-soft text-success-onsoft'
                            : 'border-grape-border bg-grape-soft text-grape-onsoft',
                        )}
                      >
                        {match.verified ? '✓ Verified' : '◆ AI'}
                      </span>
                    </article>
                  )}
                </Repeat>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </section>
  );
}
