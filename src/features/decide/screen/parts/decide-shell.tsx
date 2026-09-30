import type { ReactNode } from 'react';

/**
 * The frame every question sits in.
 *
 * Three zones, and the split is load-bearing on a phone:
 *
 *   HEAD     progress, title, and anything pinned under it (the search field)
 *   BODY     the only part that scrolls
 *   FOOT     Back and Continue
 *
 * Head and foot are fixed so the question stays readable and the buttons stay
 * under the thumb while somebody scrolls 400 ingredients. Letting the whole
 * page scroll meant the title left the screen and Continue was a scroll away,
 * which is the worst possible arrangement for a step you are meant to answer
 * and move on from.
 *
 * `h-dvh` rather than `min-h-dvh`: the body can only be given its own scroll
 * if the shell is exactly the height of the viewport. `dvh` also tracks the
 * mobile browser chrome as it hides, so the footer does not sit under it.
 */
interface DecideShellProps {
  readonly step: number;
  readonly total: number;
  readonly eyebrow: string;
  readonly title: string;
  readonly sub?: string | undefined;
  /**
   * Pinned under the title, above the scroll.
   *
   * For a control that must stay reachable while the body moves, such as the
   * kitchen search field and the tray of what has been picked.
   */
  readonly sticky?: ReactNode;
  readonly children: ReactNode;
  readonly footer: ReactNode;
}

export function DecideShell({
  step,
  total,
  eyebrow,
  title,
  sub,
  sticky,
  children,
  footer,
}: DecideShellProps) {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[520px] flex-col bg-paper">
      {/* ── HEAD ─────────────────────────────────────────────────────── */}
      <header className="flex shrink-0 flex-col gap-3 px-4 pb-3 pt-4">
        {/* Back lives at the bottom, beside Continue, where the thumb already
            is. A second one up here would be two controls doing one job. */}
        <div className="flex items-center gap-3">
          <div className="flex flex-1 items-center gap-1.5" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <i
                key={i}
                className={[
                  'h-1.5 flex-1 rounded-pill',
                  i < step ? 'bg-sky' : 'bg-skeleton',
                ].join(' ')}
              />
            ))}
          </div>

          <span className="shrink-0 font-mono text-[10.5px] font-semibold text-ink-4 tnum">
            {step} / {total}
          </span>
        </div>

        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-overline text-ink-3">
            {eyebrow}
          </div>
          <h1 className="mt-1.5 font-display text-[26px] font-extrabold leading-[1.08] tracking-display text-ink">
            {title}
          </h1>
          {sub !== undefined && <p className="mt-1 text-[13.5px] text-ink-3">{sub}</p>}
        </div>

        {sticky}
      </header>

      {/* ── BODY ─────────────────────────────────────────────────────────
          The only scroll on the screen. `overscroll-contain` stops a flick at
          the end of the list from dragging the page behind it, and the bottom
          padding keeps the last row clear of the footer's edge. */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        <div className="flex flex-col gap-4">{children}</div>
      </div>

      {/* ── FOOT ─────────────────────────────────────────────────────────
          A hairline rather than a shadow: the system's depth is a solid
          drop-edge, and a blurred shadow here would be the only one in the
          product. `pb-[max(...)]` clears the iPhone home indicator. */}
      <footer className="flex shrink-0 flex-col gap-2 border-t-hair border-line bg-paper px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {footer}
      </footer>
    </div>
  );
}
