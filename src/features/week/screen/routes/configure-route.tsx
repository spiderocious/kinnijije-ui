import { useNavigate } from '@tanstack/react-router';

import { ROUTES } from '@shared/constants/routes';

import { usePlanDraft } from '../../services/plan-draft';
import { ConfigureStage } from '../stages/configure-stage';

/**
 * `/timetable/configure` — stage two.
 *
 * Everything the screen collects writes through to the draft on change, so
 * pressing back to the kitchen and coming forward again finds the same
 * answers.
 *
 * IT DOES NOT SUBMIT. Generate navigates to the plan screen with
 * `?generate=1` and that screen owns the call — because a ten-second request
 * held open behind a disabled button on a form somebody has already filled in
 * is the worst place to wait. The plan screen can show a skeleton of the
 * result instead, and send them back here with a toast if it fails.
 *
 * THE DRAFT SURVIVES GENERATING, deliberately. "Edit" on the plan comes
 * straight back here, and a cleared draft would show the defaults rather than
 * the answers they just used, with their whole kitchen gone. The draft IS the
 * editing state for this flow; the plan is the result of running it.
 */
export default function TimetableConfigureRoute() {
  const navigate = useNavigate();
  const { draft, patch } = usePlanDraft();

  return (
    <ConfigureStage
      initial={{
        days: draft.days,
        startDate: draft.startDate,
        slots: draft.slots,
        household: draft.household,
        budgetNgn: draft.budgetNgn,
        effortMinutes: draft.effortMinutes,
        repeats: draft.repeats,
        city: draft.city,
      }}
      // Never pending here any more: the work happens on the next screen.
      pending={false}
      onChange={(values) => {
        patch(values);
      }}
      onBack={() => {
        void navigate({ to: ROUTES.TIMETABLE_KITCHEN });
      }}
      onGenerate={(values) => {
        /*
         * Persist first, THEN navigate. The plan screen reads the draft to
         * build its request, so a value changed and submitted in the same
         * gesture has to be written before the next screen mounts.
         */
        patch(values);
        void navigate({ to: ROUTES.TIMETABLE_PLAN, search: { generate: '1' } });
      }}
    />
  );
}
