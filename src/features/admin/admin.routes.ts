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

export const adminDecideRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ADMIN_DECIDE,
  component: lazyRouteComponent(() => import('./screen/admin-decide-route')),
});

export const adminDecideLogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ADMIN_DECIDE_LOG('$logId'),
  component: lazyRouteComponent(() => import('./screen/admin-decide-detail-route')),
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

// Chowdeck. Every section is a literal; the two detail routes come later.
export const adminChowdeckRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ADMIN_CHOWDECK,
  component: lazyRouteComponent(() => import('./screen/admin-chowdeck-route')),
});

export const adminChowdeckRequestsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ADMIN_CHOWDECK_REQUESTS,
  component: lazyRouteComponent(() => import('./screen/admin-chowdeck-requests-route')),
});

export const adminChowdeckCacheRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ADMIN_CHOWDECK_CACHE,
  component: lazyRouteComponent(() => import('./screen/admin-chowdeck-cache-route')),
});

export const adminChowdeckCoverageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ADMIN_CHOWDECK_COVERAGE,
  component: lazyRouteComponent(() => import('./screen/admin-chowdeck-coverage-route')),
});

export const adminChowdeckPlacesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ADMIN_CHOWDECK_PLACES,
  component: lazyRouteComponent(() => import('./screen/admin-chowdeck-places-route')),
});

export const adminChowdeckClicksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ADMIN_CHOWDECK_CLICKS,
  component: lazyRouteComponent(() => import('./screen/admin-chowdeck-clicks-route')),
});

// Parameterised last.
export const adminChowdeckRequestRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/chowdeck/requests/$callId',
  component: lazyRouteComponent(() => import('./screen/admin-chowdeck-request-detail-route')),
});

export const adminChowdeckCacheEntryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/chowdeck/cache/$entryId',
  component: lazyRouteComponent(() => import('./screen/admin-chowdeck-cache-detail-route')),
});

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

export const adminStaffRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ADMIN_STAFF,
  component: lazyRouteComponent(() => import('./screen/admin-staff-route')),
});

export const adminAuditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ADMIN_AUDIT,
  component: lazyRouteComponent(() => import('./screen/admin-audit-route')),
});

/** PUBLIC. No guard — see the route component. */
export const adminAcceptInviteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ADMIN_ACCEPT_INVITE,
  component: lazyRouteComponent(() => import('./screen/admin-accept-invite-route')),
});

export const adminScriptsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ADMIN_SCRIPTS,
  component: lazyRouteComponent(() => import('./screen/admin-scripts-route')),
});

export const adminCampaignsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ADMIN_CAMPAIGNS,
  component: lazyRouteComponent(() => import('./screen/admin-campaigns-route')),
});

// Literal before the parameterised one, as everywhere else.
export const adminCampaignComposeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ADMIN_CAMPAIGN_COMPOSE,
  component: lazyRouteComponent(() => import('./screen/admin-campaign-compose-route')),
});

export const adminCampaignBatchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/campaigns/batches/$batchId',
  component: lazyRouteComponent(() => import('./screen/admin-campaign-batch-route')),
});
