import { RouteGuard } from '@features/auth';

import Screen from './add-stock-screen';

export default function AddStockRoute() {
  return (
    <RouteGuard>
      <Screen />
    </RouteGuard>
  );
}
