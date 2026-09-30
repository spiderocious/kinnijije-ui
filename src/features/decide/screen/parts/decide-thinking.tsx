import { useEffect, useState } from 'react';

import { DECIDE_COPY } from '../../content/decide.content';
import { ILLUSTRATION } from '../../content/decide.illustrations';

/**
 * The wait.
 *
 * Grape, because a machine is working: the one colour reserved system-wide for
 * AI provenance.
 *
 * The bar is HONEST about being an estimate rather than a measurement. There is
 * no progress to report, because the server does not stream one, so it eases
 * towards 90% and stops there until the real answer lands. It never reaches
 * 100 on its own, which is the difference between a paced estimate and a lie:
 * a bar that sits full while nothing has happened is worse than no bar.
 */

/** Where the estimate stalls, waiting for the real answer. */
const CEILING = 90;

/** How long the estimate takes to approach the ceiling. */
const RAMP_MS = 4_000;

const STEP_MS = 60;

/** What the flow is doing, roughly, as the bar moves. */
const PHASES: readonly { at: number; label: string }[] = [
  { at: 0, label: 'Reading what you have' },
  { at: 30, label: 'Matching against recipes' },
  { at: 60, label: 'Narrowing it down' },
  { at: 82, label: 'Picking one' },
];

function phaseFor(percent: number): string {
  let label = PHASES[0]?.label ?? '';
  for (const phase of PHASES) if (percent >= phase.at) label = phase.label;
  return label;
}

interface DecideThinkingProps {
  readonly candidates: number | null;
}

export function DecideThinking({ candidates }: DecideThinkingProps) {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const started = performance.now();

    const id = setInterval(() => {
      const elapsed = performance.now() - started;
      // easeOutCubic: quick early, slowing as it nears the ceiling, which is
      // how a real job that is mostly-done actually feels.
      const progress = Math.min(1, elapsed / RAMP_MS);
      const eased = 1 - Math.pow(1 - progress, 3);
      setPercent(Math.round(eased * CEILING));
    }, STEP_MS);

    return () => { clearInterval(id); };
  }, []);

  return (
    <div
      className="mx-auto flex h-dvh w-full max-w-[520px] flex-col items-center justify-center gap-5 bg-paper px-6 text-center"
      role="status"
      aria-live="polite"
    >
      <img
        src={ILLUSTRATION.thinkingPot}
        alt=""
        width={120}
        height={120}
        className="h-auto w-[120px] animate-bob"
      />

      <h1 className="font-display text-[22px] font-extrabold tracking-display text-ink">
        {DECIDE_COPY.thinking.title}
      </h1>

      <div className="flex w-full max-w-[340px] flex-col gap-2">
        <div
          className="h-2.5 w-full overflow-hidden rounded-pill border-hair border-line-2 bg-skeleton"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Working it out"
        >
          <div
            className="h-full rounded-pill bg-grape transition-[width] duration-200 ease-kj-out"
            style={{ width: `${String(percent)}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-3 text-[12px]">
          <span className="text-ink-3">{phaseFor(percent)}</span>
          <span className="font-mono font-semibold text-ink-2 tnum">{percent}%</span>
        </div>
      </div>

      {candidates !== null && (
        <p className="font-mono text-[11.5px] text-ink-4 tnum">
          {candidates} recipes → narrowing → 1
        </p>
      )}
    </div>
  );
}
