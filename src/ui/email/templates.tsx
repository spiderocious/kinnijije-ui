import { Repeat, Show } from 'meemaw';

import {
  EmailBody,
  EmailButton,
  EmailCard,
  EmailFooter,
  EmailHeader,
  EmailHeading,
  EmailShell,
  EmailText,
} from './email-kit';

/**
 * The five email templates.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/380-email-low-stock.html
 *                                                          381-email-have-you-eaten.html
 *                                                          382-email-weekly.html
 *                                                          383-email-use-it-up.html
 *                                                          384-email-welcome.html
 *
 * **Frequency is part of the spec, not a runtime detail.** Each template's
 * doc comment states when it may be sent, because an email system whose cadence
 * lives only in a cron job is one nobody can audit.
 *
 * Two rules across all five: nothing animates (most clients strip it), and no
 * layout depends on an image loading.
 */

const UNSUBSCRIBE = 'https://kinnijije.ng/email/stop';
const PAUSE = 'https://kinnijije.ng/email/pause';

export interface LowStockItem {
  readonly name: string;
  readonly state: string;
  /** Why it matters — "4 saved meals need it". */
  readonly reason?: string;
}

export interface LowStockEmailProps {
  readonly items: readonly LowStockItem[];
  /** The one that actually blocks something. */
  readonly headline: string;
  /** The count is old — the copy hedges rather than asserting. */
  readonly staleDays?: number;
}

/**
 * **At most weekly**, and only when something genuinely blocks a meal the cook
 * makes often. A low-stock email about a spice they use twice a year is how an
 * inbox learns to ignore you. If nothing is low, nothing is sent — there is no
 * empty version of this email.
 */
export function LowStockEmail({ items, headline, staleDays }: LowStockEmailProps) {
  return (
    <EmailShell preheader="Rice is out, and four of your meals need it">
      <EmailHeader />
      <EmailBody>
        <EmailHeading>
          {items.length} {items.length === 1 ? 'thing is' : 'things are'} running low
        </EmailHeading>

        <Show when={staleDays === undefined}>
          <EmailText>{headline}</EmailText>
        </Show>
        <Show when={staleDays !== undefined}>
          {/* Old data hedges rather than asserting. */}
          <EmailText>
            Going by your last count, {staleDays} days ago, {items.length} things looked low.
          </EmailText>
        </Show>

        <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%">
          <tbody>
            <Repeat each={[...items]}>
              {(item: LowStockItem) => (
                <tr key={item.name}>
                  <td
                    style={{
                      padding: '10px 14px',
                      marginBottom: 8,
                      backgroundColor: '#EEF4F8',
                      border: '1px solid #E3ECF2',
                      borderRadius: '16px 5px 16px 5px',
                    }}
                  >
                    <strong style={{ color: '#132430', fontSize: 15 }}>{item.name}</strong>
                    <div style={{ fontSize: 13, color: '#6E8798', marginTop: 2 }}>
                      {item.state}
                      {item.reason !== undefined && ` · ${item.reason}`}
                    </div>
                  </td>
                </tr>
              )}
            </Repeat>
          </tbody>
        </table>

        <div style={{ marginTop: 18 }}>
          <EmailButton href="https://kinnijije.ng/market" label="See my market list" />
        </div>

        <p style={{ marginTop: 16, fontSize: 13, color: '#6E8798' }}>
          You asked us to tell you when things run low.
        </p>
      </EmailBody>
      <EmailFooter unsubscribeHref={UNSUBSCRIBE} pauseHref={PAUSE} />
    </EmailShell>
  );
}

export interface HaveYouEatenEmailProps {
  /** Something specific to point at. Omitted when there is nothing. */
  readonly suggestion?: { readonly name: string; readonly minutes: number; readonly note: string };
  /** The kitchen data is old — drop the specifics rather than be wrong. */
  readonly stale?: boolean;
}

/**
 * **At most once a fortnight, and never twice unanswered.** A second unanswered
 * nudge is nagging; the third is why people mark mail as spam. If two go
 * unopened, the product stops sending them until the cook comes back on their
 * own.
 *
 * The hardest email in the product to get right. **It is a question, not a
 * reprimand** — people stop cooking for reasons that are none of the product's
 * business, and an email that implies failure is one that gets unsubscribed.
 * The pause link sits in the BODY, not only the footer.
 */
export function HaveYouEatenEmail({ suggestion, stale = false }: HaveYouEatenEmailProps) {
  return (
    <EmailShell preheader="No judgement. Your spinach is still waiting">
      <EmailHeader />
      <EmailBody>
        <EmailHeading>Have you eaten?</EmailHeading>

        <Show when={stale}>
          <EmailText>
            It has been a while. Want us to find you something for tonight?
          </EmailText>
        </Show>

        <Show when={!stale && suggestion === undefined}>
          <EmailText>
            Nothing to report from your kitchen — we just wanted to check in. Come back whenever.
          </EmailText>
        </Show>

        <Show when={!stale && suggestion !== undefined}>
          <EmailText>
            We have not heard from you in a few days. No judgement — but you still have spinach
            that wants using, and it would make a good Efo Riro.
          </EmailText>
          {suggestion !== undefined && (
            <EmailCard
              name={suggestion.name}
              minutes={suggestion.minutes}
              source="seed"
              href="https://kinnijije.ng/meals"
            />
          )}
        </Show>

        <div style={{ marginTop: 18 }}>
          <EmailButton href="https://kinnijije.ng" label="Show me what I can make" />
        </div>

        {/* The way out sits in the body, not buried in the footer. */}
        <p style={{ marginTop: 16, fontSize: 14, color: '#6E8798' }}>
          Or just tell us to leave you alone for a while —{' '}
          <a href={PAUSE} style={{ color: '#6E8798', textDecoration: 'underline' }}>
            pause these
          </a>
          .
        </p>
      </EmailBody>
      <EmailFooter unsubscribeHref={UNSUBSCRIBE} pauseHref={PAUSE} />
    </EmailShell>
  );
}

export interface WeeklyEmailProps {
  readonly cooked: number;
  /** The week's figures come from a stale count — the email says so. */
  readonly staleDays?: number;
  readonly meals: readonly { readonly name: string; readonly minutes: number; readonly source: 'seed' | 'ai' }[];
}

/** **Weekly**, on a fixed day. The only cadence email that always has something to say. */
export function WeeklyEmail({ cooked, meals, staleDays }: WeeklyEmailProps) {
  return (
    <EmailShell preheader={`You cooked ${cooked} times this week`}>
      <EmailHeader title="Your week" />
      <EmailBody>
        <EmailHeading>You cooked {cooked} times</EmailHeading>
        {/* The count is real; its basis may be old, and that is said up front
            rather than left for the cook to discover it does not add up. */}
        {staleDays !== undefined && (
          <EmailText>
            Some of this is estimated — your kitchen count is about {staleDays} days old.
          </EmailText>
        )}
        <EmailText>
          Here is what you might make next, from what was in your kitchen this week.
        </EmailText>

        <Repeat each={[...meals]}>
          {(meal: { name: string; minutes: number; source: 'seed' | 'ai' }) => (
            <EmailCard
              key={meal.name}
              name={meal.name}
              minutes={meal.minutes}
              source={meal.source}
              href="https://kinnijije.ng/meals"
            />
          )}
        </Repeat>

        <div style={{ marginTop: 18 }}>
          <EmailButton href="https://kinnijije.ng" label="See what to cook" />
        </div>
      </EmailBody>
      <EmailFooter unsubscribeHref={UNSUBSCRIBE} pauseHref={PAUSE} />
    </EmailShell>
  );
}

export interface UseItUpEmailProps {
  readonly ingredient: string;
  readonly daysLeft: number;
  /**
   * `null` means: things are turning, but nothing makeable uses them.
   *
   * **Still worth sending** — the cook can act on "your spinach is going" even
   * without a recipe. Suppressing the email because the suggestion engine came
   * back empty would withhold the useful half to protect the other one.
   */
  readonly meal: { readonly name: string; readonly minutes: number } | null;
  /**
   * Freshness estimated from an old count.
   *
   * The email then drops the day figure rather than stating a number derived
   * from a stock level nobody has confirmed in a week.
   */
  readonly staleDays?: number;
}

/**
 * **Only when something is genuinely about to spoil**, and at most twice a
 * week. This is the one email that saves the cook money, so it earns its place
 * — but only while it stays true.
 */
export function UseItUpEmail({ ingredient, daysLeft, meal, staleDays }: UseItUpEmailProps) {
  const stale = staleDays !== undefined;
  const item = ingredient.toLowerCase();

  return (
    <EmailShell
      preheader={
        stale ? `Your ${item} may be turning` : `Your ${item} has about ${daysLeft} days left`
      }
    >
      <EmailHeader />
      <EmailBody>
        <EmailHeading>Use up your {item}</EmailHeading>

        {/* Stale freshness drops the number rather than asserting one. */}
        <EmailText>
          {stale
            ? `Your kitchen count is about ${staleDays} days old, so this is a rough guess.`
            : `About ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left.`}{' '}
          {meal !== null
            ? 'Here is something that uses it tonight.'
            : 'Nothing in your kitchen quite makes a meal from it yet — worth a look before it turns.'}
        </EmailText>

        {meal !== null && (
          <EmailCard
            name={meal.name}
            minutes={meal.minutes}
            source="seed"
            href="https://kinnijije.ng/meals"
          />
        )}

        <div style={{ marginTop: 18 }}>
          <EmailButton
            href="https://kinnijije.ng/meals"
            label={meal !== null ? 'Cook this tonight' : 'Open your kitchen'}
          />
        </div>
      </EmailBody>
      <EmailFooter unsubscribeHref={UNSUBSCRIBE} pauseHref={PAUSE} />
    </EmailShell>
  );
}

/** **Once, on sign-up.** The only transactional email in the set. */
export function WelcomeEmail({ name }: { readonly name: string }) {
  return (
    <EmailShell preheader="Tell us what is in your kitchen and we will do the rest">
      <EmailHeader />
      <EmailBody>
        <EmailHeading>Welcome, {name}</EmailHeading>
        <EmailText>
          Tell us what is in your kitchen — type it, say it, or take a photo — and we will find you
          three meals you can actually cook tonight.
        </EmailText>
        <EmailText>
          Recipes written and tested by people are marked <strong>✓ Verified</strong>. When nothing
          tested matches, we ask a model and label it <strong>◆ Made by AI</strong>, with the
          quantities marked as estimates. You will always know which you are looking at.
        </EmailText>

        <div style={{ marginTop: 18 }}>
          <EmailButton href="https://kinnijije.ng" label="Open your kitchen" />
        </div>
      </EmailBody>
      <EmailFooter unsubscribeHref={UNSUBSCRIBE} />
    </EmailShell>
  );
}
