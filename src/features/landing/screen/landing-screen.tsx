import { useNavigate } from '@tanstack/react-router';

import { ROUTES } from '@shared/constants/routes';
import { DESKTOP_QUERY, useMediaQuery } from '@shared/hooks/use-media-query';
import {
  SiteFaq,
  SiteFinalCta,
  SiteFooter,
  SiteHeader,
  SiteHero,
  SiteHowItWorks,
  SitePricing,
  SiteTrust,
} from '@ui/site';

import { FAQ_ITEMS, PRICING_TIERS } from '../content/landing.content';

/**
 * The front door.
 *
 * The `landing` scene picks its layout from a `frame` prop because the viewer
 * renders both side by side. A real page has one viewport, so the same choice
 * is made from a media query — the composition genuinely differs (the hero is
 * centred on a phone and split on a desktop), which is more than a class swap
 * can express.
 */
export default function LandingScreen() {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const navigate = useNavigate();

  const goRegister = () => {
    void navigate({ to: ROUTES.REGISTER });
  };

  const goLogin = () => {
    void navigate({ to: ROUTES.LOGIN });
  };

  return (
    <div className="min-h-dvh bg-ground">
      <SiteHeader onStart={goRegister} onSignIn={goLogin} />
      <SiteHero variant={isDesktop ? 'split' : 'centred'} onStart={goRegister} />
      <SiteHowItWorks layout={isDesktop ? 'across' : 'timeline'} />
      <SiteTrust />
      {/* SitePricing takes no callback — its tier CTAs are presentational in
          the design system, so the page's conversion paths are the header,
          the hero and the closing CTA. */}
      <SitePricing tiers={PRICING_TIERS} />
      <SiteFaq items={FAQ_ITEMS} />
      <SiteFinalCta onStart={goRegister} />
      <SiteFooter />
    </div>
  );
}
