import { RouteGuard } from '@features/auth';

import Screen from './cook-screen';

export default function CookRoute() {
  return (
    <RouteGuard>
      <Screen />
    </RouteGuard>
  );
}
