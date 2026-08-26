/**
 * Single source of truth for every path in the app.
 * Never inline a path string in a <Link to="..."> or navigate("...").
 */
export const ROUTES = {
  ROOT: '/',
  ENTRY: '/',
  PREVIEW: '/preview',
  SCENES: '/scenes',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
