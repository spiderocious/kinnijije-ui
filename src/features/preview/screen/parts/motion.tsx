import { Repeat } from 'meemaw';

import { Demo, Grid, Note, Rule, Section, Specimen } from './preview-canvas';

/**
 * Visual spec: design-system/projects/kinnijije-v2/preview/05-motion.html
 */

interface Curve {
  token: string;
  value: string;
  use: string;
}

const CURVES: Curve[] = [
  { token: '--ease', value: 'cubic-bezier(.34, 1.4, .5, 1)', use: 'The playful overshoot — arrivals' },
  { token: '--ease-out', value: 'cubic-bezier(.22, .8, .3, 1)', use: 'Overlays, anything settling' },
  { token: '--ease-in', value: 'cubic-bezier(.5, 0, .75, 0)', use: 'Departures only' },
];

const DURATIONS: Curve[] = [
  { token: '--t-press', value: '130ms', use: 'A button meets its edge' },
  { token: '--t-fast', value: '180ms', use: 'Colour, opacity, small moves' },
  { token: '--t-base', value: '260ms', use: 'A plate set down' },
  { token: '--t-slow', value: '380ms', use: 'Overlays entering' },
];

interface Anim {
  name: string;
  className: string;
  when: string;
}

const ANIMATIONS: Anim[] = [
  { name: 'serve', className: 'animate-serve', when: 'A card arrives — the default entrance' },
  { name: 'pop', className: 'animate-pop', when: 'A badge or count appears' },
  { name: 'steam', className: 'animate-steam', when: 'A dish is hot — decorative only' },
  { name: 'bob', className: 'animate-bob', when: 'The chef is idle and waiting' },
  { name: 'shimmer', className: 'animate-shimmer', when: 'A skeleton is loading' },
];

export function MotionPart() {
  return (
    <Specimen
      title="Motion"
      spec="05-motion.html"
      description="One overshoot curve for arrivals, and nothing loops except a live timer and the AI blob."
    >
      <Rule>
        <b>Nothing loops except a live timer and the AI blob.</b> A looping animation on anything
        else is a distraction that never resolves — the cook is holding a knife.
      </Rule>

      <Section label="CURVES">
        <Demo>
          <div className="flex flex-col gap-3">
            <Repeat each={CURVES}>
              {(curve: Curve) => (
                <div key={curve.token} className="border-b border-line pb-3">
                  <code className="font-mono text-xs font-bold">{curve.token}</code>
                  <code className="ml-3 font-mono text-xs text-ink-3">{curve.value}</code>
                  <p className="mt-1 text-sm text-ink-2">{curve.use}</p>
                </div>
              )}
            </Repeat>
          </div>
        </Demo>
      </Section>

      <Section label="DURATIONS">
        <Demo>
          <div className="flex flex-col gap-3">
            <Repeat each={DURATIONS}>
              {(step: Curve) => (
                <div key={step.token} className="flex items-baseline gap-4 border-b border-line pb-3">
                  <code className="w-[110px] shrink-0 font-mono text-xs font-bold">
                    {step.token}
                  </code>
                  <span className="w-[70px] shrink-0 font-mono text-xs tnum text-ink-2">
                    {step.value}
                  </span>
                  <span className="text-sm text-ink-2">{step.use}</span>
                </div>
              )}
            </Repeat>
          </div>
        </Demo>
      </Section>

      <Section label="THE NAMED ANIMATIONS">
        <Demo>
          <Grid cols={3}>
            <Repeat each={ANIMATIONS}>
              {(anim: Anim) => (
                <div key={anim.name} className="rounded-blade-sm border border-line-2 p-4">
                  <div className="mb-3 grid h-14 place-items-center">
                    <div
                      className={`h-10 w-10 rounded-blade-xs border border-ink bg-sky ${anim.className}`}
                    />
                  </div>
                  <p className="font-mono text-xs font-bold">{anim.name}</p>
                  <p className="mt-1 text-xs leading-snug text-ink-3">{anim.when}</p>
                </div>
              )}
            </Repeat>
          </Grid>
        </Demo>
        <Note>
          The entrance animations run once and hold their end state (<code>both</code>). Only
          shimmer, steam and bob repeat, and each is either a loading state or a creature.
        </Note>
      </Section>

      <Section label="REDUCED MOTION">
        <Demo>
          <p className="text-sm text-ink-2">
            Under <code className="font-mono text-xs">prefers-reduced-motion: reduce</code> every
            animation and transition in the system collapses to 0.01ms and runs once. Nothing is
            hidden and no layout changes — the end state is simply reached immediately.
          </p>
        </Demo>
      </Section>
    </Specimen>
  );
}
