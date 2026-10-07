import { Show } from 'meemaw';

/**
 * The runway chart — frame 06's `.runway`.
 *
 * CURRENTLY UNUSED, and kept deliberately. The day-by-day depletion countdown
 * it draws was switched off as a product decision: it needed an accurate
 * quantity and unit on every stock row, and a guest supplies neither, so it
 * produced confident dates from numbers nobody entered. `RunwayStage` now
 * shows the shopping list and imports only `BuyRow` from here.
 *
 * Kept rather than deleted because the simulation behind it is intact and
 * tested — restoring the chart is a product decision plus reliable
 * quantities, not a rebuild. Deleting it would make that a rewrite instead.
 *
 * CSS GRID AND ABSOLUTE SEGMENTS, not SVG: there are no curves in this design,
 * it has to reflow at phone width, and the bars are positioned as percentages
 * of the plan's own length. A grid does that natively and stays readable in the
 * markup; an SVG would need a viewBox recomputed per row.
 *
 * THE HONESTY RULES, all of them from the spec:
 *
 *   - Depletion and spoilage get DIFFERENT words. Panla does not run out, it
 *     goes off while you still have it, which is worse.
 *   - A unit with no fixed size gets the HATCHED row and "can't measure".
 *     Palm oil is sold by the bottle; there is no truthful countdown, and
 *     "can't measure" beats a confident fiction.
 */

export type RunwayRowState =
  /** Lasts the whole plan. */
  | 'holds'
  /** Gets thin but does not run out. */
  | 'tight'
  /** Hits zero partway through. */
  | 'out'
  /** Goes off while still in the kitchen. A different problem from running out. */
  | 'spoils'
  /** No fixed-size unit, so no countdown is possible. */
  | 'unmeasurable';

export interface RunwayRow {
  readonly name: string;
  /** "2 congo", "4 pieces" — what they have, in their own units. */
  readonly held: string;
  readonly state: RunwayRowState;
  /**
   * Where the trouble starts, as a fraction of the plan (0-1).
   *
   * Null for `holds` and `unmeasurable`, which have no breaking point.
   */
  readonly breakAt: number | null;
  /** "out Thu", "spoils Wed", "tight Sun", "holds". */
  readonly label: string;
}

function pct(value: number): string {
  return `${String(Math.round(Math.min(Math.max(value, 0), 1) * 100))}%`;
}

export function RunwayChart({
  rows,
  axis,
}: {
  readonly rows: readonly RunwayRow[];
  /** Day labels across the bottom. Four is what fits at phone width. */
  readonly axis: readonly string[];
}) {
  return (
    <div className="overflow-hidden rounded-blade-sm border-2 border-ink bg-white shadow-drop-sm">
      <div className="px-3 pb-1.5 pt-2.5">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.11em] text-ink-3">
          Your kitchen, day by day
        </span>
      </div>

      {rows.map((row) => (
        <div
          key={row.name}
          className="grid grid-cols-[76px_1fr] items-center gap-[9px] border-b border-hair border-line px-3 py-[7px] last:border-b-0"
        >
          <div className="text-[11.5px] font-extrabold leading-[1.2] text-ink">
            {row.name}
            <span className="block font-mono text-[9.5px] font-semibold text-ink-4">
              {row.held}
            </span>
          </div>

          {/*
           * `.bar` — a blade-cornered track with absolutely positioned
           * segments. The hatched background is only drawn for the
           * unmeasurable case, where there is no segment to draw at all.
           */}
          <div
            className="relative h-[19px] overflow-hidden rounded-[4px_1px_4px_1px] border border-hair border-line-2 bg-paper-2"
            style={
              row.state === 'unmeasurable'
                ? {
                    background:
                      'repeating-linear-gradient(45deg,var(--paper-2),var(--paper-2) 4px,var(--paper-3) 4px,var(--paper-3) 8px)',
                  }
                : undefined
            }
          >
            <Show when={row.state === 'holds'}>
              <span className="absolute inset-y-0 left-0 w-full bg-success opacity-[0.85]" />
            </Show>

            {/* Tight: good for most of the plan, amber for the tail. */}
            <Show when={row.state === 'tight'}>
              <span
                className="absolute inset-y-0 left-0 bg-success opacity-[0.85]"
                style={{ width: pct(row.breakAt ?? 0.75) }}
              />
              <span
                className="absolute inset-y-0 bg-caution opacity-[0.85]"
                style={{
                  left: pct(row.breakAt ?? 0.75),
                  width: pct(1 - (row.breakAt ?? 0.75)),
                }}
              />
            </Show>

            {/*
             * Out: green, a short amber warning band, then red — and a hard
             * ink marker at the exact breaking point. The marker is what makes
             * "out Thu" locatable rather than approximate.
             */}
            <Show when={row.state === 'out'}>
              <span
                className="absolute inset-y-0 left-0 bg-success opacity-[0.85]"
                style={{ width: pct(Math.max((row.breakAt ?? 0.5) - 0.16, 0)) }}
              />
              <span
                className="absolute inset-y-0 bg-caution opacity-[0.85]"
                style={{
                  left: pct(Math.max((row.breakAt ?? 0.5) - 0.16, 0)),
                  width: pct(Math.min(0.16, row.breakAt ?? 0.5)),
                }}
              />
              <span
                className="absolute inset-y-0 bg-critical opacity-[0.85]"
                style={{ left: pct(row.breakAt ?? 0.5), width: pct(1 - (row.breakAt ?? 0.5)) }}
              />
              <span
                className="absolute -bottom-0.5 -top-0.5 w-0.5 bg-ink"
                style={{ left: pct(row.breakAt ?? 0.5) }}
              />
            </Show>

            {/*
             * Spoils: deliberately NOT drawn as a depletion. The bar stops
             * where the food turns, and the rest is left empty — because they
             * still have it, it is simply no longer worth cooking. Drawing it
             * red to the end would say "you ran out", which is a different and
             * less useful thing to be told.
             */}
            <Show when={row.state === 'spoils'}>
              <span
                className="absolute inset-y-0 left-0 bg-success opacity-[0.85]"
                style={{ width: pct(Math.max((row.breakAt ?? 0.3) - 0.14, 0)) }}
              />
              <span
                className="absolute inset-y-0 bg-caution opacity-[0.85]"
                style={{
                  left: pct(Math.max((row.breakAt ?? 0.3) - 0.14, 0)),
                  width: pct(Math.min(0.14, row.breakAt ?? 0.3)),
                }}
              />
            </Show>

            <span
              className={`absolute right-[5px] top-1/2 -translate-y-1/2 font-mono text-[9.5px] font-semibold ${
                row.state === 'spoils'
                  ? 'text-caution-onsoft'
                  : row.state === 'unmeasurable'
                    ? 'text-ink-3'
                    : row.state === 'holds'
                      ? 'text-white'
                      : 'text-ink'
              }`}
            >
              {row.label}
            </span>
          </div>
        </div>
      ))}

      {/* `.rwaxis` — aligned to the bar column, not the whole row. */}
      <div className="grid grid-cols-[76px_1fr] gap-[9px] px-3 pb-[9px] pt-1">
        <div />
        <div className="flex justify-between font-mono text-[9px] font-semibold text-ink-4">
          {axis.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * `.buyrow` — one line of "To finish the week".
 *
 * Tickable, because the list is something somebody carries to a market and
 * works through. The price is an ESTIMATE and the panel below the list says
 * so — never presented as what they will actually pay.
 */
export function BuyRow({
  name,
  detail,
  price,
  checked,
  onToggle,
}: {
  readonly name: string;
  readonly detail: string;
  /** Null where the units would not convert. Shown as "no estimate". */
  readonly price: number | null;
  readonly checked: boolean;
  readonly onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-[9px] border-b border-hair border-line py-2 text-left last:border-b-0"
    >
      <span
        className={`grid h-[19px] w-[19px] flex-none place-items-center rounded-[5px_2px_5px_2px] border-2 border-ink ${
          checked ? 'bg-sky' : 'bg-white'
        }`}
      >
        <Show when={checked}>
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="3.4"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="m5 13 4 4L19 7" />
          </svg>
        </Show>
      </span>

      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-bold text-ink">{name}</div>
        <div className="font-mono text-[10.5px] font-semibold text-ink-4">{detail}</div>
      </div>

      <span className="ml-auto flex-none font-mono text-[12px] font-semibold text-ink-2">
        <Show when={price !== null} fallback={<span className="text-ink-4">no estimate</span>}>
          ₦{(price ?? 0).toLocaleString('en-NG')}
        </Show>
      </span>
    </button>
  );
}
