import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-job-detail-screen';

export default function AdminJobDetailRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
