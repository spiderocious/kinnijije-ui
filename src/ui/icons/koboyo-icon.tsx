import { useMemo } from 'react';

import { KOBOYO_GLYPHS, type KoboyoIconName } from './koboyo-data';

/**
 * koboyo hand-drawn icon, re-stroked.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/10-icon-weight.html
 *
 * koboyo ships icons as filled outline paths with NO stroke — the drawn line is
 * the fill shape, so it thins out optically as the icon shrinks and is unusable
 * at 16-24px. We re-stroke every path in `currentColor`, which fattens the pen
 * line without altering the artwork.
 *
 * Because each icon keeps its own viewBox extent (74-285 user units across the
 * set), a fixed stroke-width would render at a different optical weight per
 * icon. The width is therefore derived from the icon's own viewBox:
 *
 *   strokeWidth = weightPx * (viewBoxHeight / renderedPx)
 *
 * which holds the apparent line weight identical across every icon at every size.
 */

/** Optical weight in CSS pixels added to the drawn line. */
const WEIGHT_BOXED = 1.2; // default: in a button, chip, row, tile, on any background
const WEIGHT_ALONE = 1.15; // standing alone, medium
const WEIGHT_DISPLAY = 0.9; // standing alone, large illustration mark

/** Above this rendered size a bare icon reads as an illustration, not a glyph. */
const DISPLAY_THRESHOLD_PX = 56;

function weightFor(px: number, alone: boolean): number {
  if (!alone) return WEIGHT_BOXED;
  return px > DISPLAY_THRESHOLD_PX ? WEIGHT_DISPLAY : WEIGHT_ALONE;
}

/** Inject stroke attributes into every drawn element of the raw markup. */
function restroke(markup: string, strokeWidth: number): string {
  const stroke = `stroke="currentColor" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round" `;
  return markup
    .replace(/<path /g, `<path ${stroke}`)
    .replace(/<(circle|ellipse|rect|polygon|polyline) /g, `<$1 ${stroke}`);
}

export interface KoboyoIconProps {
  /** Which of the 184 cached koboyo glyphs to render. */
  readonly name: KoboyoIconName;
  /**
   * Rendered HEIGHT in pixels. Width follows the aspect ratio — koboyo icons
   * are not a fixed square grid, so never force a square box.
   */
  readonly size?: number;
  /**
   * The icon stands bare — no container, no background behind it — so it takes
   * the lighter pen. Standalone marks get colour rather than more weight.
   */
  readonly alone?: boolean;
  /** Override the derived optical weight. Escape hatch; prefer `alone`. */
  readonly weight?: number;
  readonly className?: string;
  /**
   * Accessible label. Omit for decorative icons — the SVG is then marked
   * aria-hidden, which is the right default beside a text label.
   */
  readonly title?: string;
}

export function KoboyoIcon({
  name,
  size = 24,
  alone = false,
  weight,
  className,
  title,
}: KoboyoIconProps) {
  const glyph = KOBOYO_GLYPHS[name];

  const inner = useMemo(() => {
    const w = weight ?? weightFor(size, alone);
    return restroke(glyph.d, Math.round(w * (glyph.h / size) * 100) / 100);
  }, [glyph, size, alone, weight]);

  const width = Math.round((glyph.w / glyph.h) * size * 100) / 100;

  return (
    <svg
      viewBox={glyph.vb}
      width={width}
      height={size}
      fill="currentColor"
      className={className}
      role={title === undefined ? undefined : 'img'}
      aria-label={title}
      aria-hidden={title === undefined ? true : undefined}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}

export type { KoboyoIconName };
