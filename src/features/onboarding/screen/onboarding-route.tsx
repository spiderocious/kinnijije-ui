import { RouteGuard } from '@features/auth';

import OnboardingScreen from './onboarding-screen';

/**
 * `isOnboardingRoute` stops the guard bouncing an un-onboarded user back here
 * forever — and sends an already-onboarded one on to the kitchen if they walk
 * back into this route from history.
 */
export default function OnboardingRoute() {
  return (
    <RouteGuard isOnboardingRoute>
      <OnboardingScreen />
    </RouteGuard>
  );
}
