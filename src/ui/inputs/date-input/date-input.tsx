import { cn } from '@shared/utils/cn';
import {
  FIELD_BASE_CLASS,
  FIELD_SIZE_CLASS,
  fieldStateClass,
  type FieldSize,
  type FieldTriad,
} from '../field-contract';

/**
 * Date, time and range fields.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/59-date.html
 *                                                          60-date-range.html
 *                                                          61-time.html
 *
 * These wrap the **native** pickers rather than re-implementing a calendar. A
 * hand-rolled date picker has to re-solve locale, keyboard navigation, screen
 * readers and every phone's own conventions — and loses to the platform on all
 * four. The chrome is ours; the picking is the browser's.
 *
 * Values are ISO strings (`2026-08-27`, `18:30`), so nothing has to guess at a
 * locale format when it crosses a wire.
 */

interface BaseProps extends FieldTriad {
  readonly label: string;
  readonly size?: FieldSize;
  readonly id?: string;
  readonly className?: string;
}

export interface DateInputProps extends BaseProps {
  /** ISO `YYYY-MM-DD`, or empty. */
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly min?: string;
  readonly max?: string;
}

export function DateInput({
  value,
  onChange,
  min,
  max,
  label,
  size = 'md',
  id,
  disabled,
  readOnly,
  invalid,
  className,
}: DateInputProps) {
  return (
    <input
      id={id}
      type="date"
      value={value}
      min={min}
      max={max}
      disabled={disabled}
      readOnly={readOnly}
      aria-label={label}
      aria-invalid={invalid === true ? true : undefined}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        FIELD_BASE_CLASS,
        FIELD_SIZE_CLASS[size],
        fieldStateClass({ disabled, readOnly, invalid }),
        'font-mono tnum',
        className,
      )}
    />
  );
}

export interface TimeInputProps extends BaseProps {
  /** `HH:MM`, 24-hour, or empty. */
  readonly value: string;
  readonly onChange: (value: string) => void;
  /** Minutes. 15 suits a cooking app better than 1. */
  readonly step?: number;
}

export function TimeInput({
  value,
  onChange,
  step = 15,
  label,
  size = 'md',
  id,
  disabled,
  readOnly,
  invalid,
  className,
}: TimeInputProps) {
  return (
    <input
      id={id}
      type="time"
      value={value}
      step={step * 60}
      disabled={disabled}
      readOnly={readOnly}
      aria-label={label}
      aria-invalid={invalid === true ? true : undefined}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        FIELD_BASE_CLASS,
        FIELD_SIZE_CLASS[size],
        fieldStateClass({ disabled, readOnly, invalid }),
        'font-mono tnum',
        className,
      )}
    />
  );
}

export interface DateRangeProps extends BaseProps {
  readonly from: string;
  readonly to: string;
  readonly onChange: (range: { from: string; to: string }) => void;
  readonly min?: string;
  readonly max?: string;
}

/**
 * A range as two fields, not one.
 *
 * **The `from` field bounds the `to` field's `min`**, so an end before a start
 * is unpickable rather than merely invalid — the control refuses the mistake
 * instead of reporting it afterwards.
 */
export function DateRange({
  from,
  to,
  onChange,
  min,
  max,
  label,
  size = 'md',
  disabled,
  readOnly,
  invalid,
  className,
}: DateRangeProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <DateInput
        value={from}
        onChange={(next) => onChange({ from: next, to: to !== '' && next > to ? next : to })}
        min={min}
        max={max}
        label={`${label} — from`}
        size={size}
        disabled={disabled}
        readOnly={readOnly}
        invalid={invalid}
      />
      <span aria-hidden="true" className="shrink-0 text-sm text-ink-3">
        to
      </span>
      <DateInput
        value={to}
        onChange={(next) => onChange({ from, to: next })}
        // An end before a start is unpickable, not merely invalid.
        min={from !== '' ? from : min}
        max={max}
        label={`${label} — to`}
        size={size}
        disabled={disabled}
        readOnly={readOnly}
        invalid={invalid}
      />
    </div>
  );
}
