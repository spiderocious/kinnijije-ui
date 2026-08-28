import { useCallback } from 'react';

import { useNavigate, useRouterState } from '@tanstack/react-router';

/**
 * Keeps a flow's stage in the URL rather than in component state.
 *
 * Three things fall out of that, and all three are broken without it:
 *   - the browser BACK button walks back through the flow instead of leaving it
 *   - a refresh keeps your place
 *   - a stage is linkable and testable on its own
 *
 * Guards are the other half: landing on a later stage with no data to support
 * it must bounce to the entry point, or somebody pasting a URL sees an empty
 * confirm screen with nothing to confirm.
 */
export function useStepParam<T extends string>(options: {
  /** The query key, e.g. `step`. */
  readonly key: string;
  /** Every legal value, in order. Anything else is treated as the first. */
  readonly stages: readonly T[];
  /** Extra keys to preserve when moving between stages. */
  readonly carry?: readonly string[];
}): {
  stage: T;
  params: URLSearchParams;
  go: (stage: T, extra?: Record<string, string | undefined>) => void;
  back: () => void;
  setParam: (name: string, value: string | undefined) => void;
} {
  const navigate = useNavigate();
  const search = useRouterState({ select: (state) => state.location.searchStr });

  const params = new URLSearchParams(search);
  const raw = params.get(options.key);

  // An unknown or absent stage is the first one — a mistyped URL must land
  // somewhere sane rather than rendering nothing.
  const stage = (options.stages.includes(raw as T) ? raw : options.stages[0]) as T;

  const write = useCallback(
    (next: URLSearchParams, replace = false) => {
      // TanStack types `search` against each route's declared shape, which these
      // ad-hoc flow params are deliberately not part of — they belong to the
      // flow, not the route contract. An object of plain strings is what the
      // router serialises, so it is built here and passed through.
      const record: Record<string, string> = {};
      for (const [name, value] of next.entries()) record[name] = value;
      void navigate({ to: window.location.pathname, search: record as never, replace });
    },
    [navigate],
  );

  const go = useCallback(
    (nextStage: T, extra: Record<string, string | undefined> = {}) => {
      const next = new URLSearchParams(search);
      next.set(options.key, nextStage);
      for (const [name, value] of Object.entries(extra)) {
        if (value === undefined) next.delete(name);
        else next.set(name, value);
      }
      // A push, not a replace: this is what makes BACK step backwards.
      write(next);
    },
    [search, options.key, write],
  );

  const back = useCallback(() => {
    window.history.back();
  }, []);

  const setParam = useCallback(
    (name: string, value: string | undefined) => {
      const next = new URLSearchParams(search);
      if (value === undefined) next.delete(name);
      else next.set(name, value);
      // Replaces rather than pushes — changing a value within a stage is not
      // a step somebody should have to press back through.
      write(next, true);
    },
    [search, write],
  );

  return { stage, params, go, back, setParam };
}
