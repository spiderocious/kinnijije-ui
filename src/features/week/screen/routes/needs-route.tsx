import { useNavigate } from '@tanstack/react-router';

import { ROUTES } from '@shared/constants/routes';

import { NeedsSkeleton } from '../../parts/plan-skeletons';
import { RunwayStage } from '../stages/runway-stage';
import { PlanGate } from './plan-gate';

/**
 * `/timetable/needs` — what the week needs that the kitchen does not have.
 *
 * `needs` rather than `runway` in the path, because that is what the screen
 * answers now. The depletion countdown is off: nothing runs out, so there is
 * no runway to show — only the gap between the plan and the kitchen.
 */
export default function TimetableNeedsRoute() {
  const navigate = useNavigate();

  return (
    <PlanGate title="What you need" skeleton={<NeedsSkeleton />}>
      {(summary) => (
        <RunwayStage
          summary={summary}
          onBack={() => {
            void navigate({ to: ROUTES.TIMETABLE_PLAN });
          }}
        />
      )}
    </PlanGate>
  );
}
