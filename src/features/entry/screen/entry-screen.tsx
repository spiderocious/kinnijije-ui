import { EntryHero } from './parts/entry-hero';
import { EntryStack } from './parts/entry-stack';

export function EntryScreen() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-6 py-16 sm:py-24">
      <EntryHero />
      <EntryStack />
    </div>
  );
}

export default EntryScreen;
