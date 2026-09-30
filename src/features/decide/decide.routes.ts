import { createRoute, lazyRouteComponent } from '@tanstack/react-router';

import { ROUTES } from '@shared/constants/routes';
import { rootRoute } from '@app/app.root-route';

import { DECIDE_STAGES, type DecideStage } from './types/decide.types';

/**
 * The step lives in the URL, not in component state.
 *
 * That is what makes the phone's Back button and the browser's Back button do
 * the obvious thing: go back one question. Holding it in `useState` meant Back
 * left the flow entirely from step four, which is the single most annoying
 * thing a multi-step form can do.
 *
 * A search param rather than a path segment, so every step is the same route
 * and moving between them never unmounts the screen or refetches the tiles.
 */
interface DecideSearch {
  /**
   * Optional, so every existing `<Link to="/">` in the app still typechecks
   * and still lands on the start of the flow. Absent means "hero".
   */
  step?: DecideStage;
}

/**
 * An unknown or missing step falls back to the start rather than throwing.
 *
 * A hand-edited URL is somebody being curious, not an error worth a crash
 * screen, and a stale link from an older build must still open.
 */
function validateSearch(search: Record<string, unknown>): DecideSearch {
  const raw = search['step'];
  const step = DECIDE_STAGES.find((stage) => stage === raw);
  // `hero` is the default and is left OUT of the URL rather than written as
  // `?step=hero`: the entry point should be a bare `/decide`, both for sharing
  // and because a canonical URL with a redundant param is worse for search.
  return step === undefined || step === 'hero' ? {} : { step };
}

/** One component, mounted at both paths. */
const screen = lazyRouteComponent(() => import('./screen/decide-screen'));

/**
 * The front door.
 *
 * `/` renders the flow itself rather than redirecting to it, so landing on the
 * site costs no extra navigation and the URL people type stays the URL they
 * are on.
 */
export const decideRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ENTRY,
  component: screen,
  validateSearch,
});

/**
 * The same screen at `/decide`.
 *
 * Kept working so links shared while the flow lived only there still resolve,
 * and so the path stays nameable. `/` is the canonical one — see index.html.
 */
export const decideAliasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.DECIDE,
  component: screen,
  validateSearch,
});
