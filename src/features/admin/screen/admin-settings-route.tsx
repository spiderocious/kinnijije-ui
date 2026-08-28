import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-settings-screen';

export default function AdminSettingsRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
