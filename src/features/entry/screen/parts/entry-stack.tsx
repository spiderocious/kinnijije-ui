import { Repeat } from 'meemaw';

import { Check } from '@icons';

interface StackItem {
  id: string;
  title: string;
  description: string;
}

// Not `readonly` — meemaw's Repeat types `each` as a mutable T[].
const STACK_ITEMS: StackItem[] = [
  {
    id: 'router',
    title: 'TanStack Router',
    description: 'Type-safe, code-based routes owned by each feature and lazy loaded.',
  },
  {
    id: 'query',
    title: 'TanStack Query',
    description: 'The only data-fetching tool. No bare useEffect + fetch, anywhere.',
  },
  {
    id: 'tailwind',
    title: 'Tailwind CSS v3',
    description: 'Semantic tokens mapped to CSS variables, merged through cn().',
  },
  {
    id: 'fsd',
    title: 'Feature-Sliced Design',
    description: 'features/ own their screens, api, providers, guards and routes.',
  },
];

export function EntryStack() {
  return (
    <section aria-labelledby="entry-stack-heading" className="flex flex-col gap-4">
      <h2
        id="entry-stack-heading"
        className="text-xs font-extrabold uppercase tracking-overline text-ink-3"
      >
        What is wired up
      </h2>

      <ul className="grid gap-3 sm:grid-cols-2">
        <Repeat each={STACK_ITEMS}>
          {(item: StackItem) => (
            <li key={item.id} className="rounded-blade-sm border border-line-2 bg-white p-4">
              <p className="flex items-center gap-2 font-extrabold">
                <Check size={16} className="text-success" aria-hidden="true" />
                {item.title}
              </p>
              <p className="mt-1 text-sm text-ink-2">{item.description}</p>
            </li>
          )}
        </Repeat>
      </ul>
    </section>
  );
}
