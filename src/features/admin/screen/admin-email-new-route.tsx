import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-email-new-screen';

export default function AdminEmailNewRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
