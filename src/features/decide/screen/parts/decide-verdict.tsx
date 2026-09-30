import { ArrowRight, Check, ChevronRight, Clock, Plus, RotateCcw, Sparkles, Users } from 'lucide-react';

import { KoboyoIcon, type KoboyoIconName } from '@ui/icons';
import { Button } from '@ui/primitives';

import { DECIDE_COPY } from '../../content/decide.content';
import { ILLUSTRATION } from '../../content/decide.illustrations';
import type { DecideMeal, DecideVerdict } from '../../types/decide.types';

interface DecideVerdictProps {
  readonly verdict: DecideVerdict;
  readonly rejectedName: string | null;
  readonly onCook: () => void;
  readonly onReject: () => void;
  readonly onChoose: (mealId: string) => void;
  readonly onChangeAnswer: () => void;
  readonly onRestart: () => void;
  readonly onSignUp: () => void;
}

function Fact({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-blade-xs border-hair border-line-2 bg-paper-2 px-2.5 py-1.5 text-xs font-bold text-ink-2">
      {icon}
      {children}
    </span>
  );
}

function Alternate({ meal, onChoose }: { meal: DecideMeal; onChoose: () => void }) {
  const { have, missing } = meal.match;
  const total = have.length + missing.length;

  return (
    <button
      type="button"
      onClick={onChoose}
      className="flex w-full items-center gap-2.5 rounded-blade-xs border-hair border-transparent p-2 text-left hover:border-line-2 hover:bg-paper-2"
    >
      <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[8px_3px_8px_3px] border-hair border-ink bg-greens-fill">
        {meal.hero_icon !== null ? (
          <KoboyoIcon name={meal.hero_icon as KoboyoIconName} size={19} className="text-greens-line" />
        ) : (
          <span className="text-[11px] font-extrabold text-greens-line">{meal.name.charAt(0)}</span>
        )}
      </span>
      <span className="flex-1">
        <span className="block font-display text-[13px] font-extrabold leading-tight text-ink">
          {meal.name}
        </span>
        <span className="block text-[11px] text-ink-3">
          {meal.cook_time_minutes} min
          {total > 0 && ` · you have ${String(have.length)} of ${String(total)}`}
        </span>
      </span>
      <ChevronRight size={16} strokeWidth={2.4} className="shrink-0 text-ink-4" />
    </button>
  );
}

export function DecideVerdictScreen({
  verdict,
  rejectedName,
  onCook,
  onReject,
  onChoose,
  onChangeAnswer,
  onRestart,
  onSignUp,
}: DecideVerdictProps) {
  const meal = verdict.verdict;
  const { have, missing } = meal.match;
  const total = have.length + missing.length;
  // Grape is AI provenance only. A locally-promoted meal keeps its OWN
  // templated line, so the mark must come off with it.
  const aiFramed = verdict.provenance === 'ai_framed';

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[520px] flex-col bg-paper">
      {/* The meal, the alternates and the signup band together run longer than
          a phone, so the actions are pinned rather than buried at the bottom of
          a scroll. "Cook this" is the point of the screen and must never be a
          scroll away. */}
      <header className="flex shrink-0 items-center justify-between gap-2 px-4 pb-2 pt-4">
        <span className="text-[11px] font-extrabold uppercase tracking-overline text-ink-3">
          {DECIDE_COPY.verdict.eyebrow}
        </span>
        <span className="flex items-center gap-1">
          <Button variant="tertiary" size="sm" onClick={onChangeAnswer}>
            {DECIDE_COPY.verdict.change}
          </Button>
          <Button variant="tertiary" size="sm" onClick={onRestart}>
            {DECIDE_COPY.verdict.restart}
          </Button>
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        <div className="flex flex-col gap-3">
      {rejectedName !== null && (
        <div className="flex gap-2.5 rounded-blade-xs border-hair border-success-border bg-success-soft px-3 py-2.5 text-[12.5px] text-success-onsoft">
          <Check size={17} strokeWidth={2.8} className="mt-0.5 shrink-0" />
          <span>
            <b className="block font-extrabold">{DECIDE_COPY.verdict.rejected(rejectedName)}</b>
            <span className="text-ink-3">{DECIDE_COPY.verdict.rejectedSub}</span>
          </span>
        </div>
      )}

      <article className="overflow-hidden rounded-blade-lg border-2 border-ink bg-white shadow-drop">
        <div className="relative grid min-h-[158px] place-items-center border-b-2 border-ink bg-dish-fill p-3">
          <span className="absolute left-2.5 top-2.5">
            {aiFramed ? (
              <span className="inline-flex items-center gap-1 rounded-pill border-hair border-grape-border bg-grape-soft px-2 py-0.5 text-[10.5px] font-bold text-grape-onsoft">
                <Sparkles size={11} strokeWidth={3} />
                {DECIDE_COPY.verdict.chosen}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-pill border-hair border-line-2 bg-white px-2 py-0.5 text-[10.5px] font-bold text-ink-2">
                {DECIDE_COPY.verdict.nextBest}
              </span>
            )}
          </span>

          {total > 0 && (
            <span className="absolute right-2.5 top-2.5 inline-flex items-center rounded-pill border-hair border-success-border bg-success-soft px-2 py-0.5 text-[10.5px] font-bold text-success-onsoft tnum">
              {have.length} of {total}
            </span>
          )}

          <img
            src={ILLUSTRATION.heroDish}
            alt=""
            width={168}
            height={124}
            className="mt-3 h-auto w-[168px] max-w-full"
          />
        </div>

        <div className="p-4">
          <h1 className="font-display text-2xl font-extrabold leading-[1.08] tracking-display text-ink">
            {meal.name}
          </h1>
          <p className="mt-2 text-sm text-ink-2">{meal.why}</p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <Fact icon={<Clock size={13} strokeWidth={2.4} className="text-ink-3" />}>
              {meal.cook_time_minutes} min
            </Fact>
            <Fact icon={null}>{meal.difficulty}</Fact>
            <Fact icon={<Users size={13} strokeWidth={2.4} className="text-ink-3" />}>
              Serves {meal.serves}
            </Fact>
          </div>

          {total > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-blade-xs border-hair border-success-border bg-success-soft p-2.5">
                <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-label text-success-onsoft">
                  <Check size={12} strokeWidth={3.4} />
                  {DECIDE_COPY.verdict.have}
                </div>
                <ul className="m-0 list-none p-0 text-xs font-bold text-success-onsoft">
                  {have.map((name) => (
                    <li key={name} className="py-px">{name}</li>
                  ))}
                  {have.length === 0 && <li className="py-px opacity-70">nothing yet</li>}
                </ul>
              </div>

              <div className="rounded-blade-xs border-hair border-caution-border bg-caution-soft p-2.5">
                <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-label text-caution-onsoft">
                  <Plus size={12} strokeWidth={3.2} />
                  {DECIDE_COPY.verdict.need}
                </div>
                <ul className="m-0 list-none p-0 text-xs font-bold text-caution-onsoft">
                  {missing.map((name) => (
                    <li key={name} className="py-px">{name}</li>
                  ))}
                  {missing.length === 0 && <li className="py-px opacity-70">nothing</li>}
                </ul>
              </div>
            </div>
          )}

          {meal.match.pantry.length > 0 && (
            <p className="mt-2.5 text-[11.5px] text-ink-3">
              {/* Not in the shopping list on purpose: these are things a
                  kitchen has. Said once, quietly, so nobody is surprised
                  mid-cook. */}
              <span className="font-bold text-ink-2">Also uses </span>
              {meal.match.pantry.join(', ').toLowerCase()}
              <span className="text-ink-4"> (you probably have these)</span>
            </p>
          )}

          {verdict.alternates.length > 0 && (
            <div className="mt-3 border-t-hair border-line pt-2.5">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-overline text-ink-3">
                  {DECIDE_COPY.verdict.alternates}
                </span>
                <span className="font-mono text-[11px] text-ink-4">
                  {DECIDE_COPY.verdict.swap}
                </span>
              </div>
              {verdict.alternates.map((alt) => (
                <Alternate
                  key={alt.meal_id}
                  meal={alt}
                  onChoose={() => { onChoose(alt.meal_id); }}
                />
              ))}
            </div>
          )}
        </div>
      </article>

          <KeepBand onSignUp={onSignUp} onCook={onCook} />
        </div>
      </div>

      <footer className="flex shrink-0 flex-col gap-2 border-t-hair border-line bg-paper px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button fullWidth size="lg" onClick={onCook}>
          {DECIDE_COPY.verdict.cook}
          <ArrowRight size={18} strokeWidth={2.6} className="ml-2" />
        </Button>
        <Button fullWidth variant="secondary" onClick={onReject}>
          <RotateCcw size={16} strokeWidth={2.4} className="mr-2" />
          {DECIDE_COPY.verdict.reject}
        </Button>
      </footer>
    </div>
  );
}

/** The signup offer, shown under the verdict inside the scroll. */
function KeepBand({ onSignUp, onCook }: { onSignUp: () => void; onCook: () => void }) {
  return (
      <div className="rounded-blade border-2 border-ink bg-sky-soft p-4 shadow-drop-sm">
        <h2 className="font-display text-[17px] font-extrabold text-sky-900">
          {DECIDE_COPY.verdict.keepTitle}
        </h2>
        <p className="mb-3 mt-1 text-[12.5px] text-sky-800">{DECIDE_COPY.verdict.keepBody}</p>
        <div className="flex flex-col gap-2">
          <Button fullWidth onClick={onSignUp}>
            {DECIDE_COPY.verdict.keepCta}
          </Button>
          <Button fullWidth variant="tertiary" onClick={onCook}>
            {DECIDE_COPY.verdict.keepSkip}
          </Button>
        </div>
      </div>
  );
}
