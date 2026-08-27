import { useNavigate } from '@tanstack/react-router';

import { ROUTES } from '@shared/constants/routes';
import { DESKTOP_QUERY, useMediaQuery } from '@shared/hooks/use-media-query';
import { SiteFaq, SiteFooter, SiteHeader, SiteHero, SitePricing } from '@ui/site';

import { FAQ_ITEMS, PRICING_TIERS } from '../content/landing.content';
import { FinalHob } from './parts/final-hob';
import { KitchenConveyor } from './parts/kitchen-conveyor';
import { LiveMatch } from './parts/live-match';
import { TrustPlate } from './parts/trust-plate';

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
    <div className="min-h-dvh bg-paper">
      <SiteHeader onStart={goRegister} onSignIn={goLogin} />
      <SiteHero variant={isDesktop ? 'split' : 'centred'} onStart={goRegister} />

      <KitchenConveyor />
      <LiveMatch />
      <TrustPlate />

      {/* SitePricing takes no callback — its tier CTAs are presentational in the
          design system, so the page's conversion paths are the header, the hero
          and the closing hob. */}
      <SitePricing tiers={PRICING_TIERS} />
      <SiteFaq items={FAQ_ITEMS} />

      <FinalHob onStart={goRegister} />
      <SiteFooter />
    </div>
  );
}
