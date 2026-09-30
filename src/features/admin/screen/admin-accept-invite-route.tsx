import Screen from './admin-accept-invite-screen';

/**
 * NO AdminGuard, deliberately: the person accepting an invite has no account
 * yet, so guarding this would make the link impossible to use.
 */
export default function AdminAcceptInviteRoute() {
  return <Screen />;
}
