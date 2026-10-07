import { useEffect, useRef } from 'react';

import { useNavigate, useSearch } from '@tanstack/react-router';

import { ROUTES } from '@shared/constants/routes';
import { DrawerService } from '@ui/drawer';
import { useDecideOptions } from '@features/decide/hooks/use-decide';

import { useGeneratePlan, useSetReminder, useTimetable } from '../../hooks/use-timetable';
import { GeneratingScreen, SummarySkeleton } from '../../parts/plan-skeletons';
import { usePlanDraft } from '../../services/plan-draft';
import { SummaryStage } from '../stages/summary-stage';
import { PlanGate } from './plan-gate';

/**
 * `/timetable/plan` — the hub, and the screen that BUILDS the plan.
 *
 * THE SUBMISSION LIVES HERE, not on configure. Configure used to hold the
 * request open with a disabled button while a ten-second call ran, which left
 * somebody staring at a form they had already filled in with no idea what was
 * happening — and pressing back mid-flight dropped them into a half-submitted
 * state.
 *
 * Now configure navigates here with `?generate=1` and gets out of the way.
 * This screen owns the call, shows a full-screen skeleton shaped like the
 * summary that is coming, and on failure sends them back to configure with a
 * toast. The draft still holds their answers, so nothing is lost either way.
 *
 * TWO WAYS BACK INTO THE FLOW, and they differ:
 * - EDIT keeps the draft, so changing the household does not cost the kitchen.
 * - START AGAIN clears it and returns to the kitchen screen.
 */
export default function TimetablePlanRoute() {
  const navigate = useNavigate();
  const setReminder = useSetReminder();
  const { draft, reset } = usePlanDraft();
  const search = useSearch({ strict: false }) as { generate?: string; plan?: string };
  const generate = useGeneratePlan();
  const options = useDecideOptions();

  /**
   * The run being watched, from `?plan=`.
   *
   * Put in the URL rather than component state so it survives a reload: the
   * build takes ten seconds, and somebody who refreshes mid-wait must come
   * back to the plan they asked for rather than whatever happens to be
   * newest.
   */
  const { data: current } = useTimetable(undefined, {
    ...(search.plan !== undefined && { planId: search.plan }),
  });

  const wantsGenerate = search.generate === '1';

  /**
   * The plan is being built right now.
   *
   * Read from the PLAN rather than from the mutation: the mutation resolves
   * the moment the work is accepted, which is seconds before the plan exists.
   * Keying the building screen on the mutation meant it vanished immediately
   * and showed an empty hub until the poll caught up.
   */
  const building = current?.plan.generation.status === 'pending';

  /**
   * It finished and could not be built.
   *
   * Surfaced once, then the flag is cleared by navigating — otherwise a
   * refresh would re-toast an error from a build that is long over.
   */
  const failed = current?.plan.generation.status === 'failed';

  /**
   * Fires the generate exactly once.
   *
   * A ref rather than mutation state, because React may run an effect twice in
   * development and `isPending` is not yet true on the second pass — which
   * would send two plans and bill two calls.
   */
  const fired = useRef(false);

  /** Label → catalogue id, resolved at the point of sending. */
  const idFor = (label: string): string | null => {
    for (const group of options.data?.kitchen ?? []) {
      const hit = group.items.find((item) => item.label === label);
      if (hit !== undefined) return hit.id;
    }
    return null;
  };

  useEffect(() => {
    if (!wantsGenerate || fired.current) return;
    // The ingredient catalogue has to be in before ids can be resolved.
    if (options.data === undefined) return;

    fired.current = true;

    generate.mutate(
      {
        days: draft.days,
        start_date: draft.startDate,
        slots: draft.slots,
        household: draft.household,
        kitchen: draft.kitchen.map((label) => ({
          catalogue_id: idFor(label),
          name: label,
          // They said they have it, not how much.
          quantity: null,
          unit: null,
          added_at: null,
        })),
        budget_ngn: draft.budgetNgn,
        effort_minutes: draft.effortMinutes,
        repeats: draft.repeats,
        city: draft.city,
      },
      {
        onSuccess: (accepted) => {
          /*
           * ACCEPTED, not finished. Swap `?generate=1` for `?plan=<id>`: the
           * flag must go so a refresh cannot queue a second build, and the id
           * must arrive so the poll watches THIS run rather than whatever is
           * newest for the week.
           */
          void navigate({
            to: ROUTES.TIMETABLE_PLAN,
            search: { plan: accepted.plan_id },
            replace: true,
          });
        },
        onError: (failure) => {
          DrawerService.toast(failure.message, { tone: 'critical' });
          // Back to the form, which still holds every answer.
          void navigate({ to: ROUTES.TIMETABLE_CONFIGURE, replace: true });
        },
      },
    );
    // `generate` and `navigate` are stable; the ref guards re-entry anyway.

  }, [wantsGenerate, options.data]);

  /**
   * A build that failed sends them back to the form with the reason.
   *
   * The plan row holds the error, so this survives a reload — somebody who
   * refreshed mid-build still finds out what happened rather than staring at
   * an empty hub.
   */
  useEffect(() => {
    if (!failed) return;

    DrawerService.toast(
      current?.plan.generation.error ?? 'We could not build that week. Try again.',
      { tone: 'critical' },
    );
    void navigate({ to: ROUTES.TIMETABLE_CONFIGURE, replace: true });
  }, [failed, current, navigate]);

  /**
   * The building screen covers the whole build, from the button press until
   * `generation.status` leaves `pending`.
   *
   * Three conditions, and all are needed: `wantsGenerate` covers the instant
   * before the request is sent, `isPending` covers the request itself, and
   * `building` covers the seconds afterwards while the job actually runs —
   * which is almost all of the wait. Keying this on the mutation alone made
   * the screen vanish the moment the work was ACCEPTED, showing an empty hub
   * for ten seconds until the plan landed.
   */
  if (building || generate.isPending || (wantsGenerate && !generate.isSuccess)) {
    return (
      <GeneratingScreen
        onBack={() => {
          void navigate({ to: ROUTES.TIMETABLE_CONFIGURE });
        }}
      />
    );
  }

  return (
    <PlanGate title="Your week" skeleton={<SummarySkeleton />}>
      {(summary) => (
        <SummaryStage
          summary={summary}
          reminderOn={summary.plan.remindEachMorning}
          onReminderChange={(next) => {
            setReminder.mutate({ on: next, weekOf: summary.plan.weekOf });
          }}
          onViewDetails={() => {
            void navigate({ to: ROUTES.TIMETABLE_DAYS, search: { day: 1 } });
          }}
          onOpenDay={(index) => {
            // The week list jumps straight to a day. `day` is one-based.
            void navigate({ to: ROUTES.TIMETABLE_DAYS, search: { day: index + 1 } });
          }}
          onEdit={() => {
            void navigate({ to: ROUTES.TIMETABLE_CONFIGURE });
          }}
          onOpenRunway={() => {
            void navigate({ to: ROUTES.TIMETABLE_NEEDS });
          }}
          onRegenerate={() => {
            /*
             * A real reset: the draft goes, so the kitchen screen reseeds from
             * their stock (or their last plan) and configure comes up on the
             * defaults rather than the answers behind this plan.
             */
            reset();
            void navigate({ to: ROUTES.TIMETABLE_KITCHEN });
          }}
        />
      )}
    </PlanGate>
  );
}
