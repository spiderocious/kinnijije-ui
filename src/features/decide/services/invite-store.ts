/**
 * Whether the invite has already been offered this session.
 *
 * `sessionStorage`, beside the draft and for the same reason: a shared laptop
 * must not carry one person's dismissal into the next person's visit.
 *
 * ONE dismissal ends it for the session. Asking a second time is how a
 * helpful offer becomes the thing people describe when they say a site is
 * annoying.
 */
const KEY = 'kj.invite_dismissed';

export const inviteStore = {
  dismissed(): boolean {
    try {
      return window.sessionStorage.getItem(KEY) === '1';
    } catch {
      // Storage throws outright in some private windows. Treating that as
      // "already dismissed" is the kind default: it errs towards not nagging.
      return true;
    }
  },

  dismiss(): void {
    try {
      window.sessionStorage.setItem(KEY, '1');
    } catch {
      // Nothing to do. The in-memory flag still suppresses it for this render.
    }
  },
};
