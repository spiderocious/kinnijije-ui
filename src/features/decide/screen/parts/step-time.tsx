import { MapPin } from 'lucide-react';

import { DECIDE_COPY } from '../../content/decide.content';
import type { DecideOptions, TimeBudget } from '../../types/decide.types';
import { DecideShell } from './decide-shell';
import { StepNav } from './step-nav';

interface StepTimeProps {
  /**
   * Position in the flow, passed in rather than hardcoded.
   *
   * A signed-in cook skips the kitchen step, so this is 1-of-3 for them and
   * 2-of-4 for a guest. A hardcoded number would tell one of them the wrong
   * thing about how much is left.
   */
  readonly step: number;
  readonly total: number;
  readonly options: DecideOptions | undefined;
  readonly minutes: TimeBudget | null;
  readonly city: string | null;
  readonly onMinutes: (value: TimeBudget) => void;
  readonly onCity: (value: string) => void;
  readonly onDecide: () => void;
  readonly onSkip: () => void;
  readonly onBack: () => void;
  readonly busy: boolean;
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={[
        'cursor-pointer rounded-pill border-2 px-4 py-2 font-sans text-[13px] font-extrabold',
        'transition-all duration-fast ease-kj-out',
        active
          ? 'border-ink bg-sky text-white shadow-drop-sm'
          : 'border-line-2 bg-white text-ink-2 hover:border-ink',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

export function StepTime({
  step,
  total,
  options,
  minutes,
  city,
  onMinutes,
  onCity,
  onDecide,
  onSkip,
  onBack,
  busy,
}: StepTimeProps) {
  const budgets = options?.minutes ?? [];
  const cities = options?.cities ?? [];

  return (
    <DecideShell
      step={step}
      total={total}
      title={DECIDE_COPY.time.title}
      footer={
        <StepNav
          onBack={onBack}
          onContinue={onDecide}
          continueLabel={DECIDE_COPY.time.cta}
          loading={busy}
          secondary={{ label: DECIDE_COPY.time.skip, onClick: onSkip }}
        />
      }
    >
      <div className="flex flex-wrap gap-2">
        {budgets.map((budget) => (
          <Pill
            key={budget.value}
            active={minutes === budget.value}
            onClick={() => { onMinutes(budget.value); }}
          >
            {budget.label}
          </Pill>
        ))}
      </div>

      <hr className="my-1 border-0 border-t-hair border-line" />

      <div>
        <h2 className="font-display text-[19px] font-extrabold text-ink">
          {DECIDE_COPY.time.cityTitle}
        </h2>
        <p className="mt-0.5 text-[13.5px] text-ink-3">{DECIDE_COPY.time.citySub}</p>
      </div>

      <label className="flex min-h-ctrl items-center gap-2 rounded-blade-xs border-2 border-line-2 bg-white px-3 focus-within:border-sky focus-within:shadow-drop-sm">
        <MapPin size={17} strokeWidth={2.2} className="shrink-0 text-ink-4" />
        <input
          value={city ?? ''}
          onChange={(e) => { onCity(e.target.value); }}
          placeholder={DECIDE_COPY.time.cityPlaceholder}
          aria-label="City"
          className="w-full border-0 bg-transparent font-sans text-base text-ink outline-none placeholder:text-ink-4"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        {cities.map((name) => (
          <Pill key={name} active={city === name} onClick={() => { onCity(name); }}>
            {name}
          </Pill>
        ))}
      </div>
    </DecideShell>
  );
}
