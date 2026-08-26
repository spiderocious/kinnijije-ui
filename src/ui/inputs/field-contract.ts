/**
 * The disabled / readOnly / error triad — the contract every input in the system
 * inherits.
 *
 * Visual spec: design-system/projects/kinnijije-v2/CONTRACTS.md §2
 *              design-system/projects/kinnijije-v2/preview/40-input-text.html
 *
 * These are THREE INDEPENDENT BOOLEANS, never one collapsed enum. They combine —
 * `readOnly + invalid` is normal in any review flow, and a state enum makes that
 * unrepresentable.
 *
 * | Flag       | Interactive | Legible     | Means                              |
 * |------------|-------------|-------------|------------------------------------|
 * | `disabled` | no          | dimmed      | Not available in this context      |
 * | `readOnly` | no          | FULL INK    | Real and current, just not editable|
 * | `invalid`  | yes         | full ink    | Editable, currently wrong          |
 *
 * **The shipped library had no `readOnly` at all**, which forced locked-but-
 * readable data to be faked with `disabled` — muting information the curator
 * needs to read. That is the specific bug this contract exists to prevent.
 *
 * `error` is the MESSAGE; `invalid` is the STATE. A field can be invalid before
 * it has a message to show (mid-typing, or awaiting a server response).
 */
export interface FieldTriad {
  /** Not available in this context. Dimmed, not interactive. */
  readonly disabled?: boolean;
  /**
   * Real and current, but locked now. Keeps FULL INK — a readOnly field is
   * never dimmed like a disabled one.
   */
  readonly readOnly?: boolean;
  /** Editable, currently wrong. Interactive. */
  readonly invalid?: boolean;
  /** The message. A field can be `invalid` before it has one. */
  readonly error?: string;
}

/** Scoped size scale. Resolves against the active register. */
export type FieldSize = 'sm' | 'md' | 'lg';

export const FIELD_SIZE_CLASS: Record<FieldSize, string> = {
  sm: 'h-ctrl-sm text-sm rounded-blade-sm px-3',
  md: 'h-ctrl text-ctrl rounded-blade px-4',
  lg: 'h-ctrl-lg text-md rounded-blade-lg px-5',
};

/**
 * The base chrome every field shares. A soft light border, not the heavy ink
 * one — twelve black-outlined fields on a screen read as shouting.
 */
export const FIELD_BASE_CLASS = [
  'w-full border bg-white font-sans font-semibold text-ink outline-none',
  'transition-[border-color,box-shadow,background-color] duration-[120ms]',
  'placeholder:font-medium placeholder:text-ink-4',
  'hover:border-sky-edge',
  'focus:border-sky focus:shadow-[0_0_0_4px_var(--sky-glow)]',
  'border-line-2',
].join(' ');

/** Resolves the triad to classes. Order matters: invalid wins over readOnly. */
export function fieldStateClass({ disabled, readOnly, invalid }: FieldTriad): string {
  return [
    // readOnly keeps FULL INK and takes a dashed edge — it is real data.
    readOnly === true && 'bg-paper-2 border-dashed text-ink cursor-default',
    // disabled dims, because the value may not even matter here.
    disabled === true && 'bg-paper-2 border-solid text-ink-4 cursor-not-allowed',
    // invalid is interactive — it never dims.
    invalid === true &&
      'border-critical bg-critical-soft focus:shadow-[0_0_0_4px_rgba(240,96,93,.28)]',
  ]
    .filter(Boolean)
    .join(' ');
}
