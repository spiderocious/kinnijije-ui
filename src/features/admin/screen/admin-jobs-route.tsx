import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-jobs-screen';

export default function AdminJobsRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
