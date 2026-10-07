import { useNavigate } from '@tanstack/react-router';

import { useSession } from '@features/auth/hooks/use-session';
import { ROUTES } from '@shared/constants/routes';

import { useTimetable, useTimetableKitchen } from '../../hooks/use-timetable';
import { usePlanDraft } from '../../services/plan-draft';
import { KitchenConfirmStage } from '../stages/kitchen-confirm-stage';

/**
 * `/timetable/kitchen` — stage one.
 *
 * The chosen ingredients live in the DRAFT rather than in this component, so
 * pressing back to change one shows the previous picks. That was the bug: the
 * stage held its labels in `useState`, the route unmounted on navigation, and
 * everything somebody had picked was gone.
 *
 * RESTARTING IS A CONFIRMATION, NOT RE-ENTRY. This screen is where every
 * fresh tap on "Plan your week" lands, and where "Start again" lands after
 * clearing the draft — so starting over must not mean ticking eleven things
 * again. The seed below is what makes that true.
 */
export default function TimetableKitchenRoute() {
  const navigate = useNavigate();
  const { isSignedIn } = useSession();
  const { data: stockData, isLoading } = useTimetableKitchen();
  const { data: summary, isLoading: planLoading } = useTimetable();
  const { draft, patch } = usePlanDraft();

  /**
   * What to pre-fill from, on a first visit or after a reset.
   *
   * Their STOCK when they are signed in, because that is what they actually
   * have today. Otherwise the kitchen their LAST PLAN was built against —
   * which is the only record a guest has once the draft is cleared, and is a
   * far better starting point than an empty screen for somebody who has been
   * through this flow before.
   *
   * The plan's kitchen survives `reset()` because it lives in the database on
   * the plan, not in the draft.
   */
  const seed =
    isSignedIn && (stockData?.kitchen.length ?? 0) > 0
      ? (stockData?.kitchen ?? [])
      : (summary?.plan.kitchen ?? []);

  return (
    <KitchenConfirmStage
      stock={seed}
      selected={draft.kitchen}
      /**
       * Only seed on the FIRST visit of a run. Coming back after taking
       * something out must not re-add it, which is what re-seeding on every
       * mount would do — `kitchenConfirmed` is what `reset()` clears to start
       * a genuinely fresh run.
       */
      seedFromStock={!draft.kitchenConfirmed}
      signedIn={isSignedIn}
      /*
       * Waits for BOTH, because the seed picks between them. Seeding while
       * either is still in flight would seed from an empty array and then
       * never seed again — the one-shot guard would already have fired.
       */
      loading={isLoading || planLoading}
      onChange={(kitchen) => {
        patch({ kitchen });
      }}
      onBack={() => {
        void navigate({ to: ROUTES.DECIDE });
      }}
      onConfirm={(kitchen) => {
        patch({ kitchen, kitchenConfirmed: true });
        void navigate({ to: ROUTES.TIMETABLE_CONFIGURE });
      }}
    />
  );
}
