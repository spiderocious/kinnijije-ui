import { RouteGuard } from '@features/auth';

import Screen from './meal-screen';

export default function MealRoute() {
  return (
    <RouteGuard>
      <Screen />
    </RouteGuard>
  );
}
