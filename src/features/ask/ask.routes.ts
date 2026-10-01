import { createRoute, lazyRouteComponent } from '@tanstack/react-router';

import { ROUTES } from '@shared/constants/routes';
import { rootRoute } from '@app/app.root-route';

/**
 * Ask KinniJije.
 *
 * Its own route, its own screen, its own folder. Nothing under
 * `features/decide/screen/` is imported by it except the verdict deck and the
 * thinking screen, which are mounted whole rather than adapted — so a change
 * here cannot alter the tap flow, and the review rule is simply "does this
 * diff touch features/decide".
 *
 * Lazy, like the decide screen: somebody who never opens the chat should not
 * download the recorder, the waveform or the panel.
 */
const screen = lazyRouteComponent(() => import('./screen/ask-screen'));

/** A fresh conversation. Redirects to its own id once one exists. */
export const askRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ASK,
  component: screen,
});

/**
 * An existing conversation, named in the URL.
 *
 * The same screen at both paths, so arriving at `/ask` and being given an id
 * does not unmount anything or refetch the tiles — the address bar changes and
 * the conversation continues.
 *
 * Worth having because a session id is otherwise invisible: reloading loses
 * nothing now, the back button behaves, and a support conversation can quote a
 * URL rather than asking somebody to read an id out of devtools.
 */
export const askSessionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ASK_SESSION('$sessionId'),
  component: screen,
});
