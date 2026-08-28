import { RouteGuard } from '@features/auth';

import Screen from './week-screen';

export default function WeekRoute() {
  return (
    <RouteGuard>
      <Screen />
    </RouteGuard>
  );
}
