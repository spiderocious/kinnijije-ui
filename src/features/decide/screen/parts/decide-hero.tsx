import { ArrowRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';

import { ROUTES } from '@shared/constants/routes';
import { Button } from '@ui/primitives';

import { DECIDE_COPY } from '../../content/decide.content';
import { ILLUSTRATION } from '../../content/decide.illustrations';
import { StatStrip } from './stat-strip';

/**
 * The front door.
 *
 * Centred, because there is one thing to read and one thing to press. A
 * left-aligned column makes the eye travel for no reason when nothing sits
 * beside it.
 *
 * The counters sit in the content, under the description: they are what the
 * product has DONE, so they belong with the claim they support rather than
 * floating at the bottom as furniture. The CTA is the only element carrying
 * drop weight, so the eye still has exactly one destination.
 */
interface DecideHeroProps {
  readonly onStart: () => void;
  readonly onSignIn: () => void;
  /**
   * Signed in, the app shell already provides the brand and the navigation, so
   * drawing them again here would be two chromes stacked — and a "Sign in"
   * button shown to a member is the clearest possible sign we do not know them.
   */
  readonly signedIn?: boolean;
  /** How many things are on file, so the copy can say so. */
  readonly kitchenCount?: number;
}

const { hero } = DECIDE_COPY;

export function DecideHero({
  onStart,
  onSignIn,
  signedIn = false,
  kitchenCount = 0,
}: DecideHeroProps) {
  const copy = signedIn ? hero.member : hero;
  const sub = signedIn
    ? kitchenCount > 0
      ? hero.member.subWithKitchen(kitchenCount)
      : hero.member.subEmpty
    : hero.sub;

  return (
    <div
      className={[
        'mx-auto flex w-full max-w-[520px] flex-col gap-4 bg-paper px-5 pb-8',
        signedIn ? 'min-h-[calc(100dvh-10.5rem)] pt-2' : 'min-h-dvh pt-4',
      ].join(' ')}
    >
      {!signedIn && (
      <header className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-blade-xs border-2 border-ink bg-sky text-white">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 14h16a8 8 0 0 1-8 7 8 8 0 0 1-8-7Z" />
              <path d="M12 5v2" />
            </svg>
          </span>
          <b className="font-display text-[15px] text-ink">KinniJije</b>
        </span>

        <span className="flex items-center gap-1">
          <Link
            to={ROUTES.WHY}
            className="rounded-blade-xs px-2.5 py-1.5 text-[12.5px] font-extrabold text-ink-3 hover:bg-paper-2 hover:text-ink"
          >
            {hero.why}
          </Link>
          <Button variant="tertiary" size="sm" onClick={onSignIn}>
            {hero.signIn}
          </Button>
        </span>
      </header>
      )}

      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <img
          src={ILLUSTRATION.heroPot}
          alt=""
          width={210}
          height={210}
          className="h-auto w-[190px] max-w-full sm:w-[220px]"
          // The largest paint above the fold, so it is fetched first.
          fetchPriority="high"
        />

        <h1 className="font-display text-[34px] font-extrabold leading-[1.02] tracking-display text-ink sm:text-[40px]">
          {copy.title}
          <br />
          <em className="not-italic text-sky-deep">{copy.titleAccent}</em>
        </h1>

        <p className="max-w-[40ch] text-base leading-relaxed text-ink-2">{sub}</p>

        {/* Counters are social proof. Shown to somebody who has already joined
            they are noise, so a member does not get them. */}
        {!signedIn && <StatStrip />}
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button fullWidth size="lg" onClick={onStart}>
          {copy.cta}
          <ArrowRight size={19} strokeWidth={2.6} className="ml-2" />
        </Button>

        {!signedIn && (
        <p className="text-[12.5px] text-ink-3">
          {hero.support.prompt}{' '}
          <a
            href={`mailto:${hero.support.email}?subject=${encodeURIComponent('KinniJije support')}`}
            className="font-extrabold text-sky-on underline decoration-sky decoration-2 underline-offset-2 hover:decoration-sky-deep"
          >
            {hero.support.label}
          </a>
        </p>
        )}
      </div>
    </div>
  );
}
