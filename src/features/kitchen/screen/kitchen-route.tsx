import { RouteGuard } from '@features/auth';

import KitchenScreen from './kitchen-screen';

export default function KitchenRoute() {
  return (
    <RouteGuard>
      <KitchenScreen />
    </RouteGuard>
  );
}
