import { RouteGuard } from '@features/auth';

import Screen from './settings-screen';

export default function SettingsRoute() {
  return (
    <RouteGuard>
      <Screen />
    </RouteGuard>
  );
}
