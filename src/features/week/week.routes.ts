import { createRoute, lazyRouteComponent } from '@tanstack/react-router';

import { rootRoute } from '@app/app.root-route';
import { ROUTES } from '@shared/constants/routes';

export const weekRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.WEEK,
  component: lazyRouteComponent(() => import('./screen/week-route')),
});

/**
 * The timetable: what is planned, and whether the kitchen covers it.
 *
 * Its own path rather than a tab inside /week, because it answers a different
 * question — the reading interprets the week that happened, this one simulates
 * the week ahead.
 *
 * FIVE STAGES, FIVE ROUTES. The flow used to hold its stage in `useState`,
 * which meant the hardware back button left the feature entirely from any
 * screen — unusable on Android and in the installed PWA, where back is the
 * only way out. Each stage is a route now, so back walks the flow.
 *
 * `/timetable` is the entry rather than a screen: it redirects to the kitchen
 * or to the plan depending on whether one exists, so a bookmark always lands
 * somewhere sensible. Registered BEFORE the children in the tree array, since
 * route order is load-bearing.
 */
export const timetableRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.TIMETABLE,
  component: lazyRouteComponent(() => import('./screen/timetable-entry-route')),
});

export const timetableKitchenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.TIMETABLE_KITCHEN,
  component: lazyRouteComponent(() => import('./screen/routes/kitchen-route')),
});

export const timetableConfigureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.TIMETABLE_CONFIGURE,
  component: lazyRouteComponent(() => import('./screen/routes/configure-route')),
});

/**
 * The hub, and the screen that builds the plan.
 *
 * `?generate=1` means "I have just come from configure, build it". The
 * submission lives here rather than on configure so a ten-second call happens
 * on a screen shaped like its own result, and a failure can send somebody
 * back to the form with a toast instead of stranding them on it.
 */
export const timetablePlanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.TIMETABLE_PLAN,
  validateSearch: (search: Record<string, unknown>): { generate?: string; plan?: string } => ({
    ...(search.generate === '1' && { generate: '1' as const }),
    // The run being watched. In the URL so it survives a reload mid-build.
    ...(typeof search.plan === 'string' && search.plan.length > 0 && { plan: search.plan }),
  }),
  component: lazyRouteComponent(() => import('./screen/routes/plan-route')),
});

/**
 * Day by day, with the day in the URL as `?day=1`.
 *
 * THE DAY IS A SEARCH PARAM, not component state, so paging through the week
 * is real navigation: browser back walks back a day instead of leaving the
 * screen entirely, and a particular day can be linked to or reloaded. It was
 * `useState`, which meant back from Thursday dropped you out of the feature.
 *
 * One-based, because it is user-facing and the screen says "Day 2 of 7".
 */
export const timetableDaysRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.TIMETABLE_DAYS,
  validateSearch: (search: Record<string, unknown>): { day?: number } => {
    const raw = Number(search.day);
    // Anything unparseable simply drops the param rather than erroring: a
    // mangled URL should open day one, not a broken screen.
    if (!Number.isInteger(raw) || raw < 1) return {};
    return { day: raw };
  },
  component: lazyRouteComponent(() => import('./screen/routes/days-route')),
});

export const timetableNeedsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.TIMETABLE_NEEDS,
  component: lazyRouteComponent(() => import('./screen/routes/needs-route')),
});
