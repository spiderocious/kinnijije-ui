import {
  adminAiLogRoute,
  adminAcceptInviteRoute,
  adminAuditRoute,
  adminCampaignsRoute,
  adminCampaignComposeRoute,
  adminCampaignBatchRoute,
  adminScriptsRoute,
  adminDecideLogRoute,
  adminDecideRoute,
  adminStaffRoute,
  adminAiRoute,
  adminChowdeckCacheEntryRoute,
  adminChowdeckCacheRoute,
  adminChowdeckClicksRoute,
  adminChowdeckCoverageRoute,
  adminChowdeckPlacesRoute,
  adminChowdeckRequestRoute,
  adminChowdeckRequestsRoute,
  adminChowdeckRoute,
  adminDashboardRoute,
  adminEmailRoute,
  adminEmailNewRoute,
  adminEmailsRoute,
  adminJobRoute,
  adminJobsRoute,
  adminLoginRoute,
  adminRecipeNewRoute,
  adminRecipeRoute,
  adminRecipesRoute,
  adminSettingsRoute,
  adminSetupRoute,
  adminUserRoute,
  adminUsersRoute,
} from '@features/admin/admin.routes';
import {
  forgotPasswordRoute,
  loginRoute,
  registerRoute,
  resetPasswordRoute,
} from '@features/auth/auth.routes';
import { chatRoute } from '@features/chat/chat.routes';
import { decideAliasRoute, decideRoute } from '@features/decide/decide.routes';
import { heroRoute } from '@features/hero/hero.routes';
import { kitchenRoute } from '@features/kitchen/kitchen.routes';
import { whyRoute } from '@features/landing/landing.routes';
import { marketRoute } from '@features/market/market.routes';
import { cookRoute, favouritesRoute, mealRoute, suggestionsRoute } from '@features/meals/meals.routes';
import { onboardingRoute } from '@features/onboarding/onboarding.routes';
import { previewRoute } from '@features/preview/preview.routes';
import { sceneIndexRoute, sceneRoute } from '@features/scenes/scenes.routes';
import { settingsRoute } from '@features/settings/settings.routes';
import { addStockRoute, stockItemRoute, stockRoute } from '@features/stock/stock.routes';
import { weekRoute } from '@features/week/week.routes';

import { rootRoute } from './app.root-route';

/**
 * The route tree, composed from feature-owned definitions.
 *
 * ORDER IS LOAD-BEARING: every literal path is registered before any
 * parameterised one that could swallow it — `/stock/add` before `/stock`
 * would be wrong here only if `/stock` took a parameter, but `/meals/$mealId`
 * genuinely can shadow a literal `/meals/...`, so the params go last.
 */
export const routeTree = rootRoute.addChildren([
  // Public. The decide flow IS the front door: it renders at "/" and stays
  // reachable at /decide. The marketing page keeps its own URL at /why.
  decideRoute,
  decideAliasRoute,
  whyRoute,
  heroRoute,
  registerRoute,
  loginRoute,
  forgotPasswordRoute,
  resetPasswordRoute,

  // First run
  onboardingRoute,

  // The app, literals first
  kitchenRoute,
  addStockRoute,
  stockRoute,
  marketRoute,
  suggestionsRoute,
  favouritesRoute,
  chatRoute,
  weekRoute,
  settingsRoute,

  // Parameterised last.
  mealRoute,
  cookRoute,
  stockItemRoute,

  // The console. Literals before parameters, same rule as above.
  adminSetupRoute,
  adminLoginRoute,
  adminDashboardRoute,
  adminRecipeNewRoute,
  adminRecipesRoute,
  adminUsersRoute,
  adminAiRoute,
  adminDecideRoute,
  adminEmailNewRoute,
  adminEmailsRoute,
  adminJobsRoute,
  adminSettingsRoute,
  adminStaffRoute,
  adminAuditRoute,
  adminCampaignsRoute,
  adminCampaignComposeRoute,
  adminCampaignBatchRoute,
  adminScriptsRoute,
  adminAcceptInviteRoute,
  adminChowdeckRoute,
  adminChowdeckRequestsRoute,
  adminChowdeckCacheRoute,
  adminChowdeckCoverageRoute,
  adminChowdeckPlacesRoute,
  adminChowdeckClicksRoute,
  adminRecipeRoute,
  adminUserRoute,
  adminAiLogRoute,
  adminDecideLogRoute,
  adminEmailRoute,
  adminJobRoute,
  adminChowdeckRequestRoute,
  adminChowdeckCacheEntryRoute,

  // Design-system surfaces, not product screens.
  previewRoute,
  sceneIndexRoute,
  sceneRoute,
]);
