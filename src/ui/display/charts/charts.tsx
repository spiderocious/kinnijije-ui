import { useId } from 'react';
import { Repeat, Show } from 'meemaw';

import { cn } from '@shared/utils/cn';
import { Figure } from '../figure/figure';

/**
 * The three charts.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/94-chart-bar.html
 *                                                          95-chart-line.html
 *                                                          96-sparkline.html
 *
 * Hand-rolled SVG rather than a charting library, because these three shapes
 * are the only ones the product needs and a library brings a second design
 * system with it — its own colours, its own type, its own tooltip.
 *
 * **Every chart states its own numbers.** A shape without figures is a picture,
 * and this product's posture is that a reader can check what they are shown.
 */

export interface ChartPoint {
  readonly label: string;
  readonly value: number;
}

const TONE_FILL = {
  sky: 'fill-sky',
  success: 'fill-success',
  caution: 'fill-caution',
  critical: 'fill-critical',
  ai: 'fill-grape',
} as const;

const TONE_STROKE = {
  sky: 'stroke-sky',
  success: 'stroke-success',
  caution: 'stroke-caution',
  critical: 'stroke-critical',
  ai: 'stroke-grape',
} as const;

export type ChartTone = keyof typeof TONE_FILL;

export interface BarChartProps {
  readonly data: readonly ChartPoint[];
  readonly tone?: ChartTone;
  readonly unit?: string;
  readonly height?: number;
  /** Announced to screen readers as the chart's purpose. */
  readonly label: string;
  readonly className?: string;
}

export function BarChart({
  data,
  tone = 'sky',
  unit,
  height = 160,
  label,
  className,
}: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <figure className={cn('m-0', className)}>
      <div
        role="img"
        aria-label={`${label}. ${data.map((d) => `${d.label}: ${d.value}`).join(', ')}`}
        className="flex items-end gap-2"
        style={{ height }}
      >
        <Repeat each={[...data]}>
          {(point: ChartPoint) => (
            <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              {/* The figure sits above the bar — the shape is the summary, the
                  number is the fact. */}
              <span className="font-mono text-xs tnum text-ink-3">{point.value}</span>
              <div
                className={cn('w-full rounded-t-blade-xs', TONE_FILL[tone].replace('fill-', 'bg-'))}
                style={{ height: `${(point.value / max) * 100}%`, minHeight: 2 }}
              />
            </div>
          )}
        </Repeat>
      </div>

      <div className="mt-2 flex gap-2 border-t border-line pt-2">
        <Repeat each={[...data]}>
          {(point: ChartPoint) => (
            <span key={point.label} className="min-w-0 flex-1 truncate text-center text-xs text-ink-3">
              {point.label}
            </span>
          )}
        </Repeat>
      </div>

      <Show when={unit !== undefined}>
        <figcaption className="mt-1 text-xs text-ink-4">{unit}</figcaption>
      </Show>
    </figure>
  );
}

export interface LineChartProps extends BarChartProps {
  /** Fills under the line. Off by default — a fill implies a cumulative total. */
  readonly area?: boolean;
}

export function LineChart({
  data,
  tone = 'sky',
  height = 160,
  label,
  area = false,
  className,
}: LineChartProps) {
  const gradientId = useId();
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const span = max - min || 1;

  const width = 100;
  const points = data.map((point, index) => {
    const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * width;
    const y = 100 - ((point.value - min) / span) * 100;
    return { x, y, point };
  });

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${path} L ${width} 100 L 0 100 Z`;

  return (
    <figure className={cn('m-0', className)}>
      <svg
        viewBox={`0 0 ${width} 100`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${label}. ${data.map((d) => `${d.label}: ${d.value}`).join(', ')}`}
        style={{ height }}
        className="w-full"
      >
        <Show when={area}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradientId})`} className={TONE_FILL[tone]} />
        </Show>
        <path
          d={path}
          fill="none"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className={TONE_STROKE[tone]}
        />
      </svg>

      <div className="mt-2 flex justify-between border-t border-line pt-2 text-xs text-ink-3">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </figure>
  );
}

export interface SparklineProps {
  readonly data: readonly number[];
  readonly tone?: ChartTone;
  readonly width?: number;
  readonly height?: number;
  /** The current value, rendered beside the shape. */
  readonly value?: number | string;
  readonly unit?: string;
  readonly label: string;
  readonly className?: string;
}

/**
 * A trend at a glance, inline with its own figure.
 *
 * **The figure is not optional.** A sparkline alone says "it went up" without
 * saying from what to what, which is the whole reason a reader would look.
 */
export function Sparkline({
  data,
  tone = 'sky',
  width = 88,
  height = 26,
  value,
  unit,
  label,
  className,
}: SparklineProps) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;

  const path = data
    .map((n, index) => {
      const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
      const y = 100 - ((n - min) / span) * 100;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
        width={width}
        height={height}
        className="shrink-0"
      >
        <path
          d={path}
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className={TONE_STROKE[tone]}
        />
      </svg>

      {/* Not optional — a shape with no number is a mood. */}
      <Show when={value !== undefined}>
        <Figure value={value ?? 0} unit={unit} size="sm" />
      </Show>
    </span>
  );
}
