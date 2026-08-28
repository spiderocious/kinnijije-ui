import { createRoute, lazyRouteComponent } from '@tanstack/react-router';

import { rootRoute } from '@app/app.root-route';
import { ROUTES } from '@shared/constants/routes';

/**
 * The console's routes.
 *
 * ORDER IS LOAD-BEARING, as everywhere else in this tree: `/admin/recipes/new`
 * is a LITERAL and must be registered before `/admin/recipes/$mealId`, or
 * "new" arrives as a meal id and the editor 404s.
 *
 * Guarding is the server's job — every endpoint under /admin checks the role.
 * The screens simply fail to load their data for anybody else, which is the
 * honest behaviour: a hidden route is not a permission.
 */

export const adminSetupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ADMIN_SETUP,
  component: lazyRouteComponent(() => import('./screen/admin-setup-route')),
});

export const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ADMIN_LOGIN,
  component: lazyRouteComponent(() => import('./screen/admin-login-route')),
});

export const adminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ADMIN_DASHBOARD,
  component: lazyRouteComponent(() => import('./screen/admin-dashboard-route')),
});

// Literals first.
export const adminRecipeNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ADMIN_RECIPE_NEW,
  component: lazyRouteComponent(() => import('./screen/admin-recipe-new-route')),
});

export const adminRecipesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ADMIN_RECIPES,
  component: lazyRouteComponent(() => import('./screen/admin-recipes-route')),
});

export const adminUsersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ADMIN_USERS,
  component: lazyRouteComponent(() => import('./screen/admin-users-route')),
});

export const adminAiRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ADMIN_AI,
  component: lazyRouteComponent(() => import('./screen/admin-ai-route')),
});

export const adminSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ADMIN_SETTINGS,
  component: lazyRouteComponent(() => import('./screen/admin-settings-route')),
});

export const adminEmailNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ADMIN_EMAIL_NEW,
  component: lazyRouteComponent(() => import('./screen/admin-email-new-route')),
});

export const adminEmailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ADMIN_EMAILS,
  component: lazyRouteComponent(() => import('./screen/admin-emails-route')),
});

export const adminJobsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ADMIN_JOBS,
  component: lazyRouteComponent(() => import('./screen/admin-jobs-route')),
});

// Parameterised last.
export const adminRecipeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/recipes/$mealId',
  component: lazyRouteComponent(() => import('./screen/admin-recipe-detail-route')),
});

export const adminUserRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/users/$userId',
  component: lazyRouteComponent(() => import('./screen/admin-user-detail-route')),
});

export const adminAiLogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/ai/$logId',
  component: lazyRouteComponent(() => import('./screen/admin-ai-detail-route')),
});

export const adminJobRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/jobs/$jobId',
  component: lazyRouteComponent(() => import('./screen/admin-job-detail-route')),
});

export const adminEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/emails/$emailId',
  component: lazyRouteComponent(() => import('./screen/admin-email-detail-route')),
});
