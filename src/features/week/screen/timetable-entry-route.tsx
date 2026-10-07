import { useEffect } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { ROUTES } from '@shared/constants/routes';

import { PlanAppBar, PlanBody, PlanScreen } from '../parts/plan-chrome';
import { KitchenSkeleton } from '../parts/plan-skeletons';

/**
 * `/timetable` — the entry, not a screen.
 *
 * ALWAYS RESTARTS AT THE KITCHEN. "Plan your week" is an intent to plan a
 * week, so it begins where planning begins — somebody who taps it and lands
 * on last week's finished plan has to work out how to get back to the start,
 * and the honest reading of the tap is that they want to go again.
 *
 * It used to send anybody with a plan straight to `/timetable/plan`, which
 * made the entry point behave differently depending on history the person
 * could not see. The kitchen screen is not a cost: it preloads what they
 * picked last time from the draft, and their stock when they are signed in,
 * so restarting is a confirmation rather than re-entry.
 *
 * Their plan is NOT lost by coming through here. It stays in the database
 * under its week and `/timetable/plan` still opens it — this route only
 * decides where a fresh tap begins.
 *
 * REPLACE, NOT PUSH. This route must not sit in the history stack — otherwise
 * pressing back from the kitchen screen lands here, which immediately
 * redirects forward again and traps somebody on the first screen.
 *
 * No fetch of its own any more: the decision no longer depends on whether a
 * plan exists, so the redirect is immediate rather than waiting on a request
 * whose answer it would ignore.
 */
export default function TimetableEntryRoute() {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({ to: ROUTES.TIMETABLE_KITCHEN, replace: true });
  }, [navigate]);

  // One frame of chrome while the redirect lands, so the screen does not flash
  // empty. Deliberately not a spinner: nothing is being waited on.
  return (
    <PlanScreen>
      <PlanAppBar
        title="Your week"
        onBack={() => {
          void navigate({ to: ROUTES.DECIDE });
        }}
      />
      {/* Shaped like the kitchen screen it is redirecting to, so the handover
          is invisible rather than a grey block swapping for a grid. */}
      <PlanBody>
        <KitchenSkeleton />
      </PlanBody>
    </PlanScreen>
  );
}
