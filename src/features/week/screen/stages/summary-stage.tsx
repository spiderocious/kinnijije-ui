import { Show } from 'meemaw';

import { AlertCircle, ChevronRight, Info, KoboyoIcon } from '@icons';

import {
  PlanAppBar,
  PlanBody,
  PlanButton,
  PlanDock,
  PlanLabel,
  PlanNote,
  PlanScreen,
  PlanTag,
} from '../../parts/plan-chrome';
import type { TimetableSummary } from '../../services/timetable.api';

/**
 * Frame 02 — the summary hub.
 *
 * THIS IS THE HUB, NOT A LIST. One sentence of outcome, three numbers, and the
 * problems — each tappable into the runway. The day-by-day list lives one
 * level down, because "is my week alright" is the question somebody arrives
 * with and "what is Tuesday" is the follow-up.
 *
 * THE WARNING ROWS ARE THE ENTRY TO THE RUNWAY. "2 things run out" is the
 * headline; the chart is the detail behind it, which is the right order.
 *
 * TWO BUTTONS ONLY: View details into the swipeable days, Edit back to
 * configure. Everything else here is a link, not a button.
 */

function shortDate(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString('en-NG', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** "Mon" — the week list's date column. */
function shortWeekday(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString('en-NG', {
    timeZone: 'UTC',
    weekday: 'short',
  });
}

/** The day of the month, under the weekday. */
function dayNumber(date: string): string {
  return String(new Date(`${date}T00:00:00.000Z`).getUTCDate());
}

/** "Thursday" — for naming the wet days in the weather line. */
function weekdayName(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString('en-NG', {
    timeZone: 'UTC',
    weekday: 'long',
  });
}

/*
 * No `naira` helper here any more. Every price on this screen was an estimate
 * from our own ingredient list, which the catalogue's own note says must never
 * be shown as a price somebody will pay — so the stat is a COUNT now.
 */

/** `.rowcard` — a tappable problem row. The entry to the runway. */
function RowCard({
  tone,
  title,
  detail,
  icon,
  onClick,
}: {
  readonly tone: 'warn' | 'crit';
  readonly title: string;
  readonly detail: string;
  readonly icon: 'runs-out' | 'spoils';
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-blade-xs border-2 px-[11px] py-2.5 text-left shadow-drop-sm transition-transform duration-press active:translate-x-[2px] active:translate-y-[3px] active:shadow-none ${
        tone === 'warn'
          ? 'border-caution-onsoft bg-caution-soft'
          : 'border-critical-onsoft bg-critical-soft'
      }`}
    >
      <span
        className={`grid h-[30px] w-[30px] flex-none place-items-center rounded-blade-xs border border-hair border-ink text-white ${
          tone === 'warn' ? 'bg-caution' : 'bg-critical'
        }`}
      >
        {icon === 'runs-out' ? (
          <AlertCircle size={17} strokeWidth={2.3} />
        ) : (
          <KoboyoIcon name="expiryLabel" size={17} alone />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-display text-[13.5px] font-extrabold leading-[1.2] text-ink">
          {title}
        </span>
        <span className="mt-px block text-[11.5px] text-ink-2">{detail}</span>
      </span>

      <ChevronRight size={15} strokeWidth={2.4} className="ml-auto flex-none text-ink-3" />
    </button>
  );
}

/** `.sw` — the reminder switch. */
function ReminderSwitch({
  on,
  onChange,
}: {
  readonly on: boolean;
  readonly onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-blade-xs border-2 border-ink bg-white px-[11px] py-2.5 shadow-drop-sm">
      <div className="min-w-0 flex-1">
        <div className="font-display text-[13px] font-extrabold leading-[1.2] text-ink">
          Remind me each morning
        </div>
        <div className="mt-px text-[11px] text-ink-3">
          What to cook, and what to pick up. 7am.
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Remind me each morning"
        onClick={() => {
          onChange(!on);
        }}
        className={`relative ml-auto h-6 w-[42px] flex-none rounded-pill border-2 border-ink transition-colors duration-fast ${
          on ? 'bg-success' : 'bg-skeleton'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-round border border-hair border-ink bg-white transition-[left] duration-fast ${
            on ? 'left-[21px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}

export function SummaryStage({
  summary,
  reminderOn,
  onReminderChange,
  onViewDetails,
  onOpenDay,
  onEdit,
  onOpenRunway,
  onRegenerate,
}: {
  readonly summary: TimetableSummary;
  readonly reminderOn: boolean;
  readonly onReminderChange: (next: boolean) => void;
  readonly onViewDetails: () => void;
  /** Jump straight to one day from the week list. Zero-based. */
  readonly onOpenDay: (index: number) => void;
  readonly onEdit: () => void;
  readonly onOpenRunway: () => void;
  readonly onRegenerate: () => void;
}) {
  const { plan, runway } = summary;
  const days = plan.days;

  const first = days[0]?.date ?? plan.weekOf;
  const last = days[days.length - 1]?.date ?? plan.weekOf;

  /**
   * What they do not have.
   *
   * `runs_out` is kept in the filter because the model still carries the
   * status, but with the countdown switched off nothing is ever set to it —
   * so in practice this is the missing list.
   */
  const shortLines = runway.lines.filter(
    (line) => line.status === 'runs_out' || line.status === 'missing',
  );

  /**
   * The outcome sentence.
   *
   * Written from the numbers rather than templated loosely, because the spec's
   * version — "14 meals, all from your kitchen bar two things" — is a claim
   * that has to be true. When nothing is short it says so outright.
   */
  const outcome =
    shortLines.length === 0
      ? 'all from your kitchen'
      : `all from your kitchen bar ${String(shortLines.length)} thing${shortLines.length === 1 ? '' : 's'}`;

  /** "cook-ups": distinct dishes, which is what somebody actually cooks. */
  const cookUps = new Set(days.flatMap((day) => day.meals.map((meal) => meal.mealId))).size;

  /**
   * The week's weather, summarised to one line.
   *
   * NAMES THE WET DAYS rather than averaging, because "rain Thursday" is
   * actionable and "a mix of sun and rain" is not. Null when the plan has no
   * city on it, or when every lookup failed — in which case the line is
   * simply absent rather than hedged.
   */
  const forecastDays = summary.days.filter((day) => day.weather !== null);
  const rainyDays = forecastDays.filter((day) => day.weather?.rain === true);
  const highs = forecastDays
    .map((day) => day.weather?.high)
    .filter((high): high is number => typeof high === 'number');

  const weatherLine =
    forecastDays.length === 0
      ? null
      : `${
          highs.length === 0 ? '' : `${String(Math.round(Math.max(...highs)))}°C, `
        }${
          rainyDays.length === 0
            ? 'dry all week'
            : rainyDays.length === forecastDays.length
              ? 'rain most days'
              : `rain ${rainyDays
                  .slice(0, 2)
                  .map((day) => weekdayName(day.date))
                  .join(' and ')}`
        }${plan.options?.city === null || plan.options?.city === undefined ? '' : ` in ${plan.options.city}`}.`;

  return (
    <PlanScreen>
      <PlanAppBar
        title={`Your ${String(days.length)} day${days.length === 1 ? '' : 's'}`}
        actions={
          <button
            type="button"
            onClick={onRegenerate}
            /*
             * "Start again", not "Regenerate". It clears the answers and goes
             * back to the kitchen screen, which is a different action from
             * Edit in the dock — and the old label described neither.
             */
            aria-label="Start again"
            title="Start again"
            className="grid h-8 w-8 place-items-center rounded-blade-xs border border-hair border-line-2 bg-white text-ink-2 hover:border-ink hover:bg-paper-2"
          >
            <KoboyoIcon name="cycle" size={15} alone />
          </button>
        }
      />

      <PlanBody>
        <div>
          <PlanLabel>
            {shortDate(first)} — {shortDate(last)}
          </PlanLabel>
          <div className="mt-[3px] font-display text-[20px] font-extrabold leading-[1.18] tracking-display text-ink">
            {runway.summary.mealsPlanned} meal
            {runway.summary.mealsPlanned === 1 ? '' : 's'},{' '}
            <span className="text-sky-deep">{outcome}</span>.
          </div>
        </div>

        {/* `.stats` — three numbers, no more. */}
        <div className="grid grid-cols-3 gap-[7px]">
          <Stat value={String(runway.summary.mealsPlanned)} label="meals" />
          <Stat value={String(cookUps)} label="cook-ups" />
          {/*
           * A COUNT, not a naira figure.
           *
           * The total was an estimate built from our own ingredient list, and
           * the catalogue's own note says those must never be shown as a
           * price somebody will pay — putting one in a stat tile invited
           * exactly that reading. "5 to buy" is the number people act on, and
           * it is one we can stand behind.
           */}
          <Stat value={String(runway.market.length)} label="to buy" />
        </div>

        {/*
         * ONE ROW, and it is the shopping list.
         *
         * The depletion countdown and the spoilage warning are switched off —
         * both needed quantities and purchase dates that most kitchens do not
         * carry, so they produced confident dates from numbers nobody entered.
         * What is left is the question somebody can actually act on: what do I
         * need to buy.
         */}
        <Show when={shortLines.length > 0}>
          <RowCard
            tone="warn"
            icon="runs-out"
            title={`${String(shortLines.length)} thing${shortLines.length === 1 ? '' : 's'} to buy`}
            detail={shortLines
              .slice(0, 3)
              .map((line) => line.name)
              .join(', ')}
            onClick={onOpenRunway}
          />
        </Show>

        <Show when={shortLines.length === 0}>
          <PlanNote tone="ok">
            <strong>Your kitchen covers the whole plan.</strong> Nothing to buy.
          </PlanNote>
        </Show>

        {/*
         * `.wk` — the week's weather, in one line.
         *
         * Summarised rather than listed per day: the hub is one sentence of
         * outcome and three numbers, and seven forecasts would bury both. The
         * day-by-day screen carries the per-day line.
         */}
        <Show when={weatherLine !== null}>
          <div className="flex items-center gap-2 rounded-blade-xs border border-hair border-line-2 bg-sky-soft px-[11px] py-2">
            <KoboyoIcon
              name={rainyDays.length > 0 ? 'cloud' : 'sun'}
              size={15}
              alone
              className="flex-none text-sky-deep"
            />
            <span className="text-[11.5px] text-ink-2">
              {/*
               * The forecast, with no claim attached.
               *
               * It used to say "Soups sit on the wet days, grills on the dry
               * ones" — a flat assertion about a plan the sentence had never
               * seen. Where weather genuinely shaped a slot, the planner says
               * so in that slot's own reason, which is a claim we can stand
               * behind because it was made by the thing that chose the dish.
               */}
              <strong className="font-extrabold text-ink">{weatherLine}</strong>
            </span>
          </div>
        </Show>

        {/*
         * THE WEEK, DAY BY DAY, right on the hub.
         *
         * The hub used to be numbers and a shopping row with the actual plan
         * one level down behind "View details" — so the screen that answers
         * "what am I eating this week" did not show it. Each row jumps
         * straight to that day, which is what people were using the details
         * screen's pager for anyway.
         */}
        <Show when={summary.days.length > 0}>
          <div>
            <PlanLabel>The week</PlanLabel>
            <div className="flex flex-col gap-[7px]">
              {summary.days.map((day, index) => {
                const shortfall = day.meals.filter((meal) => !meal.allInStock).length;

                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => {
                      onOpenDay(index);
                    }}
                    className="flex items-center gap-2.5 rounded-blade-xs border border-hair border-line-2 bg-white px-2.5 py-2 text-left transition-all duration-fast hover:border-ink hover:shadow-drop-sm"
                  >
                    <span className="w-[34px] flex-none text-center">
                      <span className="block font-mono text-[10px] font-semibold uppercase text-ink-4">
                        {shortWeekday(day.date)}
                      </span>
                      <span className="block font-display text-[15px] font-extrabold leading-none text-ink">
                        {dayNumber(day.date)}
                      </span>
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-bold leading-[1.35] text-ink-2">
                        {day.meals.map((meal) => meal.mealName).join(' · ') || 'Nothing planned'}
                      </span>
                      {/* The weather line, per day, where it is actually
                          useful — beside the food it influenced. */}
                      <Show when={day.weather !== null}>
                        <span className="mt-px flex items-center gap-1 text-[11px] text-ink-3">
                          <KoboyoIcon
                            name={day.weather?.rain === true ? 'cloud' : 'sun'}
                            size={11}
                            alone
                            className="flex-none text-sky-deep"
                          />
                          {day.weather?.note}
                        </span>
                      </Show>
                    </span>

                    <Show when={shortfall > 0}>
                      <PlanTag tone="warn">{shortfall} to buy</PlanTag>
                    </Show>
                    <ChevronRight size={14} strokeWidth={2.4} className="flex-none text-ink-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </Show>

        <ReminderSwitch on={reminderOn} onChange={onReminderChange} />

        {/*
         * Grape is AI provenance only, and this is the one honest claim on the
         * screen: the dishes and their order are chosen in code, and only the
         * one-line reasons are the model's.
         */}
        <div className="flex items-start gap-2 rounded-blade-xs border border-hair border-grape-border border-l-[5px] border-l-grape bg-grape-soft px-3 py-2.5 text-[11.5px] text-grape-onsoft">
          <Info size={12} strokeWidth={2.4} className="mt-0.5 flex-none" />
          <span>
            Dishes and order chosen in code. The one-line reasons are written by the model.
          </span>
        </div>

        <Show when={plan.isGuest}>
          <PlanNote tone="warn">
            <strong>This plan is saved to this browser.</strong> Sign in to keep it and get the
            morning reminders.
          </PlanNote>
        </Show>
      </PlanBody>

      <PlanDock>
        <PlanButton onClick={onViewDetails}>View details</PlanButton>
        <PlanButton variant="quiet" onClick={onEdit}>
          Edit
        </PlanButton>
      </PlanDock>
    </PlanScreen>
  );
}

/** `.st` — one of the three summary numbers. */
function Stat({ value, label }: { readonly value: string; readonly label: string }) {
  return (
    <div className="rounded-blade-xs border border-hair border-line-2 bg-white px-2.5 py-2.5">
      <div className="tnum font-display text-[19px] font-extrabold leading-none text-ink">
        {value}
      </div>
      <div className="mt-[3px] text-[10px] font-bold uppercase tracking-[0.05em] text-ink-4">
        {label}
      </div>
    </div>
  );
}
