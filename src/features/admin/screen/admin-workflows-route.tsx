import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-workflows-screen';

export default function AdminWorkflowsRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
