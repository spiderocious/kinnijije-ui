import { RouteGuard } from '@features/auth';

import Screen from './stock-item-screen';

export default function StockItemRoute() {
  return (
    <RouteGuard>
      <Screen />
    </RouteGuard>
  );
}
