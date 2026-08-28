import { RouteGuard } from '@features/auth';

import Screen from './suggestions-screen';

export default function SuggestionsRoute() {
  return (
    <RouteGuard>
      <Screen />
    </RouteGuard>
  );
}
