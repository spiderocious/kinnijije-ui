import { useEffect, useRef, useState } from 'react';

import { Show } from 'meemaw';

import { X } from '@icons';
import { cn } from '@shared/utils/cn';

/**
 * The number panel — a full keypad for one number.
 *
 * Spec: docs/v2/timetable.html §03, frames NP·1 / NP·2 / NP·3.
 *
 * WHY A CUSTOM CONTROL, which is usually the wrong call: a numeric keyboard on
 * Android still shows letters on many devices, resizes the viewport, and gives
 * no control over range or currency formatting. This is one of the few places
 * a custom control genuinely beats the native one — and the real `<input>`
 * underneath keeps hardware keyboards and screen readers working, so the
 * keypad is an enhancement rather than the only path.
 *
 * SHARED, NOT TIMETABLE-SPECIFIC. §03 is explicit that this serves every
 * numeric input in the product, which is why it lives in `@ui/inputs` and is
 * invoked imperatively rather than being a field inside one feature's form.
 */

export type NumberFormat = 'integer' | 'currency';

export interface NumberPanelRequest {
  readonly title: string;
  /** The second line. What the number is for, in the cook's words. */
  readonly hint?: string;
  readonly value?: number | null;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly format?: NumberFormat;
  /** Only read for `currency`. Naira is the only one the product uses. */
  readonly currency?: string;
  /** The word after the value — "people", "days". Never for currency. */
  readonly unit?: string;
}

/** Grouping separators as you type, so a long amount stays readable. */
function groupDigits(digits: string): string {
  if (digits === '') return '';
  return Number(digits).toLocaleString('en-NG');
}

function formatValue(digits: string, request: NumberPanelRequest): string {
  if (request.format === 'currency') {
    // The symbol is fixed to the left and never moves while typing.
    return `₦${digits === '' ? '0' : groupDigits(digits)}`;
  }
  return digits === '' ? '0' : groupDigits(digits);
}

/**
 * The step pills on the currency panel. Chosen to match what people actually
 * budget in, per the spec — not a generic 1/10/100 ladder.
 */
const CURRENCY_STEPS = [500, 1000, 5000] as const;

export function NumberPanelBody({
  request,
  onDone,
  onCancel,
}: {
  readonly request: NumberPanelRequest;
  readonly onDone: (value: number) => void;
  readonly onCancel: () => void;
}) {
  const currency = request.format === 'currency';
  const min = request.min ?? 0;
  const max = request.max ?? Number.MAX_SAFE_INTEGER;

  /**
   * Held as a DIGIT STRING, not a number.
   *
   * Typing "10" into a numeric state would pass through 1 then 10, and a
   * leading zero or an empty field has no numeric representation at all. The
   * string is the honest model of what somebody has typed so far.
   */
  const [digits, setDigits] = useState(() => {
    const initial = request.value ?? null;
    return initial === null || initial === 0 ? '' : String(Math.trunc(initial));
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const current = digits === '' ? null : Number(digits);

  /**
   * Validation is live, never punitive.
   *
   * Out of range SHOWS the limit and disables Done — it does not clear what
   * was typed. Clearing somebody's input to punish a typo is how a control
   * loses trust.
   */
  const tooLow = current !== null && current < min;
  const tooHigh = current !== null && current > max;
  const valid = current !== null && !tooLow && !tooHigh;

  // Focus the real input so a hardware keyboard works immediately.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const press = (digit: string): void => {
    setDigits((prior) => {
      const next = `${prior}${digit}`;
      // Stop the string growing without bound; the max chip already says why.
      if (next.replace(/^0+/, '').length > 12) return prior;
      return next.replace(/^0+(?=\d)/, '');
    });
  };

  const bump = (amount: number): void => {
    const base = current ?? 0;
    setDigits(String(Math.min(base + amount, max)));
  };

  const commit = (): void => {
    if (!valid || current === null) return;
    onDone(current);
  };

  return (
    <div className="px-1 pb-1">
      <div className="mb-2 flex items-start gap-2">
        <div className="min-w-0 flex-1 text-center">
          <p className="font-display text-lg font-extrabold tracking-display text-ink">
            {request.title}
          </p>
          <Show when={request.hint !== undefined}>
            <p className="text-xs text-ink-3">{request.hint}</p>
          </Show>
        </div>
      </div>

      {/* The value is the biggest thing on screen — you are editing one
          number, so it should dominate. `tnum` keeps digits from shifting
          width as they change. */}
      <div className="py-3 text-center">
        <span
          className={cn(
            'tnum font-display font-extrabold tracking-[-0.03em] text-ink',
            currency ? 'text-[40px]' : 'text-[46px]',
          )}
        >
          {formatValue(digits, request)}
        </span>
        <Show when={!currency && request.unit !== undefined}>
          <span className="ml-1.5 text-sm font-bold text-ink-3">{request.unit}</span>
        </Show>
      </div>

      {/* Currency gets step pills; integers get their limits as chips. Both
          sit in the same slot so the keypad never moves between variants. */}
      <Show
        when={currency}
        fallback={
          <div className="mb-3 flex justify-center gap-1.5">
            <span className="rounded-pill border border-line-2 bg-paper-2 px-2 py-0.5 text-[11px] font-extrabold text-ink-3">
              min {min}
            </span>
            <span className="rounded-pill border border-line-2 bg-paper-2 px-2 py-0.5 text-[11px] font-extrabold text-ink-3">
              max {max}
            </span>
          </div>
        }
      >
        <div className="mb-3 flex justify-center gap-1.5">
          {CURRENCY_STEPS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => {
                bump(amount);
              }}
              className="rounded-pill border-[1.5px] border-line-2 bg-white px-2.5 py-1 text-[11.5px] font-extrabold text-ink transition-colors hover:border-ink"
            >
              +₦{amount.toLocaleString('en-NG')}
            </button>
          ))}
        </div>
      </Show>

      <Show when={tooLow || tooHigh}>
        <p className="mb-2 text-center text-xs font-extrabold text-critical-onsoft">
          {tooLow ? `The lowest is ${String(min)}.` : `The highest is ${String(max)}.`}
        </p>
      </Show>

      {/* Blade on every key. A keypad is the most tempting place in the
          product to reach for rounded rectangles — it is not an exception. */}
      <div className="grid grid-cols-3 gap-[7px]">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <Key
            key={digit}
            onClick={() => {
              press(digit);
            }}
          >
            {digit}
          </Key>
        ))}

        {/* Currency gets `000`; integers get Clear. Three taps for a thousand
            is the commonest thing somebody does on a budget panel. */}
        <Show
          when={currency}
          fallback={
            <Key
              ghost
              aria-label="Clear"
              onClick={() => {
                setDigits('');
              }}
            >
              C
            </Key>
          }
        >
          <Key
            ghost
            onClick={() => {
              press('000');
            }}
          >
            000
          </Key>
        </Show>

        <Key
          onClick={() => {
            press('0');
          }}
        >
          0
        </Key>

        <Key
          ghost
          aria-label="Delete"
          onClick={() => {
            setDigits((prior) => prior.slice(0, -1));
          }}
        >
          <Backspace />
        </Key>
      </div>

      {/*
       * The real input, for hardware keyboards and screen readers.
       *
       * Visually hidden rather than `display:none` — a hidden input is not
       * focusable, which would take the keyboard path away entirely.
       */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={digits}
        aria-label={request.title}
        onChange={(event) => {
          setDigits(event.target.value.replace(/\D/g, '').slice(0, 12));
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit();
        }}
        className="sr-only"
      />

      {/* Done is always reachable by thumb — bottom of the sheet, full width. */}
      <button
        type="button"
        disabled={!valid}
        onClick={commit}
        className={cn(
          'mt-3 w-full rounded-blade-xs border-2 border-ink py-3 font-display text-base font-extrabold text-ink shadow-drop-sm transition-transform duration-press',
          valid
            ? 'bg-sky active:translate-x-[2px] active:translate-y-[3px] active:shadow-none'
            : 'cursor-not-allowed bg-paper-2 text-ink-4 shadow-none',
        )}
      >
        Done
      </button>

      {/* Desktop has no sheet to swipe away, so Cancel is explicit. On mobile
          the sheet's own close control and backdrop already do this, and a
          second one would be clutter — but it costs one row and removes the
          "how do I get out" question entirely. */}
      <button
        type="button"
        onClick={onCancel}
        className="mt-1.5 w-full py-2 text-xs font-extrabold text-ink-3 underline decoration-line-2 decoration-2 underline-offset-2 hover:text-ink"
      >
        Cancel
      </button>
    </div>
  );
}

function Key({
  children,
  ghost = false,
  onClick,
  ...rest
}: {
  readonly children: React.ReactNode;
  readonly ghost?: boolean;
  readonly onClick: () => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'grid min-h-[50px] place-items-center rounded-blade-xs border-2 font-display font-extrabold transition-transform duration-press active:translate-x-[2px] active:translate-y-[3px] active:shadow-none',
        ghost
          ? 'border-line-2 bg-paper-2 text-base text-ink-3 shadow-none hover:border-ink hover:text-ink'
          : 'border-ink bg-white text-xl text-ink shadow-drop-sm hover:bg-sky-soft',
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/** The spec's own delete glyph, not a generic X. */
function Backspace() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M21 5H9l-6 7 6 7h12V5Z" />
      <path d="M17 9l-5 6M12 9l5 6" />
    </svg>
  );
}

export { X as NumberPanelCloseIcon };
