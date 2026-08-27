import { useState } from 'react';
import { Repeat } from 'meemaw';

import { Button } from '@ui/primitives';
import {
  CongratsTakeover,
  CookingLoader,
  ErrorState,
  FeatureDisabled,
  Popover,
  SuccessMoment,
  Takeover,
  WarmError,
} from '@ui/feedback';
import { MealCard } from '@ui/domain';

import { Api, Demo, Note, Row, Rule, Section, Specimen } from './preview-canvas';

/**
 * Visual spec: preview/155-cooking-loader · 158-error-cold · 159-error-warm
 *              162-popover · 169-takeover · 170-success-moment
 *              171-takeover-congrats · 172-celebration-ladder · 175-feature-disabled
 */

const LADDER = [
  { rung: 1, component: 'nothing — the state change is the feedback', often: 'constant', example: 'a chip added to the basket' },
  { rung: 2, component: 'Toast', often: 'many per session', example: 'recipe saved' },
  { rung: 3, component: 'Feedback message', often: 'per form', example: 'preferences updated' },
  { rung: 4, component: 'SuccessMoment', often: 'weekly', example: 'first meal cooked from a suggestion' },
  { rung: 5, component: 'CongratsTakeover', often: '≤4 per lifetime', example: 'onboarding done; tenth meal cooked' },
];

export function ErrorStatesPart() {
  return (
    <Specimen
      title="Errors · Loader · Feature disabled"
      spec="155-cooking-loader · 158-error-cold · 159-error-warm · 175-feature-disabled"
      description="Three failures that are genuinely different and must not share a component."
    >
      <Rule>
        <b>Cold</b> — nothing to show, so the error replaces the content.{' '}
        <b>Warm</b> — a refresh failed but the cache is good, so the content{' '}
        <b>stays mounted</b> and the error is a banner above it. <b>Disabled</b> — policy, not
        failure, and there is nothing to retry.
      </Rule>

      <Section label="COLD — the content is gone">
        <Demo tone="plain">
          <div className="max-w-[520px]">
            <ErrorState
              title="Could not reach the kitchen"
              body="Check your connection and try again. Nothing you added has been lost."
              onRetry={() => {}}
            />
          </div>
          <Note>
            <code>onRetry</code> is <b>required</b> — an error with no way forward is a dead end.
            And the copy names the <b>fix</b> (“check your connection”), not the failure (“network
            error”).
          </Note>
        </Demo>
      </Section>

      <Section label="WARM — the content stays">
        <Demo tone="plain">
          <div className="flex max-w-[520px] flex-col gap-4">
            <WarmError onRetry={() => {}} age="41 minutes ago" />
            {/* The content is still here — that is the whole point. */}
            <MealCard name="Jollof Rice" source="seed" minutes={45} match="strong_match" compact />
          </div>
          <Note>
            This is a <b>banner, never a replacement</b>. If there is no cache to keep, use the
            cold error instead — a warm error above nothing is worse than an honest cold one.
          </Note>
        </Demo>
      </Section>

      <Section label="FEATURE DISABLED — policy is not failure">
        <Demo tone="plain">
          <div className="max-w-[520px]">
            <FeatureDisabled
              flag="Photo capture"
              alternative="You can still type or say what you have — those work exactly the same."
              action={<Button variant="secondary" size="sm">Type instead</Button>}
            />
          </div>
          <Note>
            Caution-toned, never critical. And <b>no retry</b> — retrying does not flip a flag, and
            offering one teaches a user to press a button that cannot work.
          </Note>
        </Demo>
      </Section>

      <Section label="COOKING LOADER">
        <Demo>
          <CookingLoader
            message="Finding you three meals"
            sub="Reading what is in your kitchen against about four hundred tested recipes."
          />
          <Note>
            <b>Reserved for waits over about two seconds.</b> A short wait gets a skeleton — a
            character that appears and vanishes inside 400ms is a flicker, and it makes a fast
            product feel slow.
          </Note>
        </Demo>
      </Section>

      <Section label="API">
        <Api>{`<ErrorState title* body* onRetry* retryLabel? secondary? />
<WarmError onRetry* age? title? />
<FeatureDisabled flag* alternative* icon? action? />
<CookingLoader message* sub? size? />

// onRetry is REQUIRED — an error with no way forward is a dead end
// WarmError's content stays mounted — it is a banner, never a replacement
// \`alternative\` is REQUIRED — a lock that names no other route is a dead end
// \`message\` is REQUIRED — a loader with no explanation is a stall`}</Api>
      </Section>
    </Specimen>
  );
}

export function CelebrationPart() {
  const [takeover, setTakeover] = useState(false);
  const [congrats, setCongrats] = useState(false);

  return (
    <Specimen
      title="The celebration ladder"
      spec="170-success-moment · 171-takeover-congrats · 172-celebration-ladder · 169-takeover"
      description="Five rungs, and a component may not be spent above its rung."
    >
      <Rule>
        <b>Celebration inflation is the fastest way to make a product feel cheap.</b> If saving a
        setting gets confetti, cooking a first meal has nowhere to go. The rungs are{' '}
        <b>typed</b> — rung 4 and 5 both require naming the occasion, which is the moment someone
        notices they are reaching too high.
      </Rule>

      <Section label="THE LADDER">
        <Demo>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-ink pb-2 pr-3 text-left text-xs font-extrabold uppercase tracking-overline text-ink-3">Rung</th>
                <th className="border-b border-ink pb-2 pr-3 text-left text-xs font-extrabold uppercase tracking-overline text-ink-3">Component</th>
                <th className="border-b border-ink pb-2 pr-3 text-left text-xs font-extrabold uppercase tracking-overline text-ink-3">How often</th>
                <th className="border-b border-ink pb-2 text-left text-xs font-extrabold uppercase tracking-overline text-ink-3">Example</th>
              </tr>
            </thead>
            <tbody>
              <Repeat each={LADDER}>
                {(row: (typeof LADDER)[number]) => (
                  <tr key={row.rung}>
                    <td className="border-b border-line py-2 pr-3 font-mono text-sm font-bold tnum">{row.rung}</td>
                    <td className="border-b border-line py-2 pr-3 font-semibold text-ink">{row.component}</td>
                    <td className="border-b border-line py-2 pr-3 text-ink-2">{row.often}</td>
                    <td className="border-b border-line py-2 text-ink-2">{row.example}</td>
                  </tr>
                )}
              </Repeat>
            </tbody>
          </table>
          <Note>
            <b>The test:</b> if you can imagine a user seeing it twice in a month, it is not a
            takeover. If they would not notice it missing, it should be rung 1.
          </Note>
        </Demo>
      </Section>

      <Section label="RUNG 4 — SUCCESS MOMENT, weekly at most">
        <Demo tone="plain">
          <div className="max-w-[520px]">
            <SuccessMoment
              occasion="first-meal-cooked"
              title="You cooked it."
              body="First meal from a suggestion. That is the whole idea working."
              actions={<Button>Save this one</Button>}
            />
          </div>
          <Note>
            <b>Never for a saved setting, a completed form, or a dismissed banner</b> — those are
            rungs 2 and 3.
          </Note>
        </Demo>
      </Section>

      <Section label="RUNG 5 — TAKEOVER, four per lifetime">
        <Demo>
          <Row>
            <Button onClick={() => setCongrats(true)}>Show the congratulatory takeover</Button>
            <Button variant="secondary" onClick={() => setTakeover(true)}>
              Show a plain takeover
            </Button>
          </Row>
          <Note>
            No scrim on either — there is nothing behind them. <code>onExit</code> is{' '}
            <b>required and always rendered</b>: cook mode is why this exists, and a cook with wet
            hands who cannot find the way out is stuck with the phone they propped up.
          </Note>
        </Demo>

        <CongratsTakeover
          open={congrats}
          onExit={() => setCongrats(false)}
          occasion="tenth-meal-cooked"
          title="Ten meals."
          body="Nine different ones. You have been cooking."
        />

        <Takeover open={takeover} onExit={() => setTakeover(false)} title="Cook mode" onDark>
          <div className="grid h-full place-items-center p-8 text-center">
            <p className="text-lg text-ink-inv/80">
              A full-screen mode. The exit is in the top-left and always reachable.
            </p>
          </div>
        </Takeover>
      </Section>
    </Specimen>
  );
}

export function PopoverPart() {
  return (
    <Specimen
      title="Popover"
      spec="162-popover.html · 166-overlay-contract.html"
      description="The tooltip's big sibling — it can hold an action, so it has to be reachable by keyboard."
    >
      <Rule>
        <b>It PORTALS.</b> The shipped popover did not, so it clipped inside every card with{' '}
        <code>overflow: hidden</code> — which is most of them. That single detail is why this is a
        component rather than a <code>&lt;div&gt;</code> with absolute positioning.
      </Rule>

      <Section label="LIVE — inside an overflow-hidden card">
        <Demo tone="plain">
          {/* Deliberately clipping — the popover escapes it. */}
          <div className="max-w-[420px] overflow-hidden rounded-blade-lg border border-ink bg-white p-5">
            <p className="mb-3 text-sm text-ink-2">
              This card clips its overflow. Open the popover — it escapes.
            </p>
            <Popover.Root>
              <Popover.Trigger>
                <span className="text-sm font-extrabold text-sky-on underline decoration-2 underline-offset-2">
                  Why is this approximate?
                </span>
              </Popover.Trigger>
              <Popover.Content title="Made by AI" side="bottom">
                Quantities are estimates and the cook time is padded by 30%, because models
                under-estimate. Flag anything wrong and a person will check it.
              </Popover.Content>
            </Popover.Root>
          </div>
        </Demo>
      </Section>

      <Section label="SIDES">
        <Demo>
          <Row className="gap-8 py-8">
            <Repeat each={['top', 'right', 'bottom', 'left'] as const}>
              {(side: 'top' | 'right' | 'bottom' | 'left') => (
                <Popover.Root key={side}>
                  <Popover.Trigger>
                    <Button variant="secondary" size="sm">
                      {side}
                    </Button>
                  </Popover.Trigger>
                  <Popover.Content side={side}>
                    Opens to the {side}, portalled to the body.
                  </Popover.Content>
                </Popover.Root>
              )}
            </Repeat>
          </Row>
        </Demo>
      </Section>

      <Section label="API">
        <Api>{`<Popover.Root open? onOpenChange? defaultOpen?>
  <Popover.Trigger />
  <Popover.Content side?="top|right|bottom|left" align? title? />
</Popover.Root>

// the five-part overlay contract: open / onOpenChange / defaultOpen /
//   Trigger / Portal
// it PORTALS — the shipped one did not and clipped inside every card
// a Tooltip is ONE line and cannot hold an action; this can, so it is a
//   real dialog rather than a hover surface`}</Api>
      </Section>
    </Specimen>
  );
}
