import { RouteGuard } from '@features/auth';

import Screen from './market-screen';

export default function MarketRoute() {
  return (
    <RouteGuard>
      <Screen />
    </RouteGuard>
  );
}
