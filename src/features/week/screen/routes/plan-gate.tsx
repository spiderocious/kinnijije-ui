import type { ReactElement } from 'react';
import { useEffect } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { ROUTES } from '@shared/constants/routes';

import { useTimetable } from '../../hooks/use-timetable';
import { PlanAppBar, PlanBody, PlanScreen } from '../../parts/plan-chrome';
import { PlanError } from '../../parts/plan-skeletons';
import type { TimetableSummary } from '../../services/timetable.api';

/**
 * The three plan screens' shared entry condition: there IS a plan.
 *
 * Needed because these are real paths now, so somebody can arrive at
 * `/timetable/needs` directly — from a bookmark, a shared link, or by pressing
 * back after the plan was cleared in another tab. Without this they would get
 * a screen rendering an undefined plan.
 *
 * REDIRECTS rather than rendering an empty state: "you have no plan" on a page
 * titled "What you need" is a dead end, and the kitchen screen is the thing
 * they actually have to do.
 */
export function PlanGate({
  title,
  skeleton,
  children,
}: {
  /** Shown on the loading and failure chrome, so it does not flash a wrong one. */
  readonly title: string;
  /**
   * The shape of what is loading, so the screen does not shift when it lands.
   *
   * Required rather than optional: every caller knows what it is about to
   * render, and a generic grey block was the thing this work set out to
   * remove.
   */
  readonly skeleton: ReactElement;
  readonly children: (summary: TimetableSummary) => ReactElement;
}) {
  const navigate = useNavigate();
  const { data: summary, isLoading, error, refetch } = useTimetable();

  const hasPlan = (summary?.plan.days.length ?? 0) > 0;
  /**
   * A plan being built right now has no days yet, and that is not the same
   * thing as having no plan. Without this check the gate would bounce
   * somebody back to the kitchen screen mid-build — losing the plan they are
   * waiting for, seconds before it lands.
   */
  const building = summary?.plan.generation.status === 'pending';

  useEffect(() => {
    if (isLoading || hasPlan || building) return;
    if (error !== null && summary === undefined) return;

    void navigate({ to: ROUTES.TIMETABLE_KITCHEN, replace: true });
  }, [building, error, hasPlan, isLoading, navigate, summary]);

  if (error !== null && summary === undefined) {
    return (
      <PlanError
        title={title}
        message={error.message}
        onRetry={() => {
          void refetch();
        }}
        onBack={() => {
          void navigate({ to: ROUTES.DECIDE });
        }}
      />
    );
  }

  if (summary === undefined || !hasPlan) {
    return (
      <PlanScreen>
        <PlanAppBar
          title={title}
          onBack={() => {
            void navigate({ to: ROUTES.DECIDE });
          }}
        />
        <PlanBody>{skeleton}</PlanBody>
      </PlanScreen>
    );
  }

  return children(summary);
}
