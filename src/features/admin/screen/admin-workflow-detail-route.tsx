import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-workflow-detail-screen';

export default function AdminWorkflowDetailRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
