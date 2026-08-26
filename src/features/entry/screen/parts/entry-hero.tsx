import { ArrowRight, Sparkles } from '@icons';
import { AppButton } from '@ui/primitives/app-button/app-button';

export function EntryHero() {
  return (
    <section className="flex flex-col items-start gap-6">
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-content-muted">
        <Sparkles size={14} aria-hidden="true" />
        Feature-Sliced Design, wired up
      </span>

      <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
        Cookiepot starts here.
      </h1>

      <p className="max-w-xl text-lg text-content-muted">
        Vite, TanStack Router, TanStack Query and Tailwind v3 — organised around business
        features rather than technical layers, so code is found where the capability lives.
      </p>

      <AppButton size="lg">
        Get started
        <ArrowRight size={18} aria-hidden="true" />
      </AppButton>
    </section>
  );
}
