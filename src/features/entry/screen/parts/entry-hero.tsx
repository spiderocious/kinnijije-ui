import { ArrowRight, Sparkles } from '@icons';
import { Button } from '@ui/primitives/button/button';

export function EntryHero() {
  return (
    <section className="flex flex-col items-start gap-6">
      <span className="inline-flex items-center gap-2 rounded-pill border border-line-2 bg-paper-2 px-3 py-1 text-xs font-extrabold text-ink-3">
        <Sparkles size={14} aria-hidden="true" />
        Feature-Sliced Design, wired up
      </span>

      <h1 className="max-w-2xl font-display text-4xl font-extrabold tracking-display sm:text-5xl">
        Kinnijije starts here.
      </h1>

      <p className="max-w-xl text-lg text-ink-2">
        Vite, TanStack Router, TanStack Query and Tailwind v3 — organised around business
        features rather than technical layers, so code is found where the capability lives.
      </p>

      <Button size="lg">
        Get started
        <ArrowRight size={18} aria-hidden="true" />
      </Button>
    </section>
  );
}
