import type { ReactNode } from 'react';

import { cn } from '@shared/utils/cn';

/**
 * The furniture every preview part is built from. Mirrors the Studio's specimen
 * chrome (`.stamp`, `.break`, `.demo`, `.states`) so a part reads like its HTML
 * source.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/_foundation.css
 */

export interface SpecimenProps {
  /** The specimen title — the component's name, not a sentence. */
  readonly title: string;
  /** What this component is for, and the rule it obeys. */
  readonly description?: ReactNode;
  /** The Studio HTML file this was built from. */
  readonly spec?: string;
  readonly children: ReactNode;
}

/** One component's whole page. */
export function Specimen({ title, description, spec, children }: SpecimenProps) {
  return (
    <article className="pb-11">
      <header className="mb-4 flex items-end gap-4 border-b-bold border-ink pb-4">
        <h1 className="flex-1 font-display text-3xl font-extrabold leading-none tracking-display">
          {title}
        </h1>
        {spec !== undefined && (
          <code className="whitespace-nowrap font-mono text-xs text-ink-3">{spec}</code>
        )}
      </header>
      {description !== undefined && (
        <p className="mb-5 max-w-[80ch] text-[15px] text-ink-2">{description}</p>
      )}
      {children}
    </article>
  );
}

export interface SectionProps {
  /** The band label — sits in an ink chip, like the Studio's `.break`. */
  readonly label: string;
  readonly children: ReactNode;
}

/** A labelled band inside a specimen. */
export function Section({ label, children }: SectionProps) {
  return (
    <section className="mt-9">
      <div className="mb-4 flex items-center gap-3">
        <span className="whitespace-nowrap rounded-blade-xs bg-ink px-2 py-1 font-mono text-xs text-white">
          {label}
        </span>
        <span className="h-[2px] flex-1 rounded-[2px] bg-ink opacity-[0.13]" />
      </div>
      {children}
    </section>
  );
}

export interface DemoProps {
  /** `plain` drops the frame for a recessed canvas; `dark` proves on-dark. */
  readonly tone?: 'default' | 'plain' | 'dark';
  readonly className?: string;
  readonly children: ReactNode;
}

/** The canvas a sample sits on. */
export function Demo({ tone = 'default', className, children }: DemoProps) {
  return (
    <div
      className={cn(
        'mb-4 rounded-blade-lg border p-6',
        tone === 'default' && 'border-ink bg-white shadow-drop',
        tone === 'plain' && 'border-dashed border-line-2 bg-paper-2',
        tone === 'dark' && 'border-ink bg-ink text-ink-inv',
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface RowProps {
  /** Optional label above the row. */
  readonly label?: string;
  readonly className?: string;
  readonly children: ReactNode;
}

/** A horizontal run of samples. */
export function Row({ label, className, children }: RowProps) {
  return (
    <div className="mb-4 last:mb-0">
      {label !== undefined && (
        <p className="mb-2 text-sm font-extrabold text-ink-3">{label}</p>
      )}
      <div className={cn('flex flex-wrap items-center gap-3', className)}>{children}</div>
    </div>
  );
}

/** A vertical stack of samples. */
export function Stack({ label, className, children }: RowProps) {
  return (
    <div className="mb-4 last:mb-0">
      {label !== undefined && (
        <p className="mb-2 text-sm font-extrabold text-ink-3">{label}</p>
      )}
      <div className={cn('flex flex-col gap-3', className)}>{children}</div>
    </div>
  );
}

export interface StateCardProps {
  /** The state's name — `hover`, `disabled`, `loading`. */
  readonly name: string;
  /** When this state applies. */
  readonly when?: string;
  readonly children: ReactNode;
}

/** One named state, framed. The Studio's `.state` block. */
export function StateCard({ name, when, children }: StateCardProps) {
  return (
    <div className="overflow-hidden rounded-blade-md border border-ink bg-white shadow-drop-sm">
      <div className="flex items-center gap-2 border-b border-ink bg-paper-2 px-3 py-2">
        <span className="font-mono text-xs font-bold uppercase tracking-[0.06em]">{name}</span>
      </div>
      <div className="p-4">{children}</div>
      {when !== undefined && (
        <p className="px-3 pb-3 text-xs leading-snug text-ink-3">{when}</p>
      )}
    </div>
  );
}

/** A responsive grid of state cards. */
export function StateGrid({ children }: { readonly children: ReactNode }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">{children}</div>
  );
}

export interface RuleProps {
  /** `rule` states a law; `warn` states what breaks. */
  readonly tone?: 'rule' | 'warn';
  readonly children: ReactNode;
}

/** A stated law of the system, framed so it cannot be skimmed past. */
export function Rule({ tone = 'rule', children }: RuleProps) {
  return (
    <div
      className={cn(
        'mb-5 max-w-[104ch] rounded-blade-md border border-ink px-5 py-4 shadow-drop',
        tone === 'rule' ? 'bg-sky-soft' : 'bg-caution-soft',
      )}
    >
      <p className="text-[13.5px] leading-relaxed text-ink">{children}</p>
    </div>
  );
}

/** The component's public API, rendered as the Studio renders it. */
export function Api({ children }: { readonly children: ReactNode }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-blade-md bg-ink px-5 py-4 font-mono text-[12.5px] leading-relaxed text-[#DCE8EF]">
      {children}
    </pre>
  );
}

/** A grid whose columns are fixed. */
export function Grid({
  cols = 3,
  className,
  children,
}: {
  readonly cols?: 2 | 3 | 4;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'grid gap-4',
        cols === 2 && 'grid-cols-2',
        cols === 3 && 'grid-cols-3',
        cols === 4 && 'grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Prose note beneath a sample. */
export function Note({ children }: { readonly children: ReactNode }) {
  return <p className="mt-2 max-w-[82ch] text-[13.5px] leading-relaxed text-ink-2">{children}</p>;
}
