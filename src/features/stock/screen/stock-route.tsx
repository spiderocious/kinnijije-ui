import { RouteGuard } from '@features/auth';

import Screen from './stock-screen';

export default function StockRoute() {
  return (
    <RouteGuard>
      <Screen />
    </RouteGuard>
  );
}
