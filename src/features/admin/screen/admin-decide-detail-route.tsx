import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-decide-detail-screen';

export default function AdminDecideDetailRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
