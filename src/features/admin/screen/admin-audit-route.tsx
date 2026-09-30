import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-audit-screen';

export default function AdminAuditRoute() {
  return (
    <AdminGuard scope="audit:read">
      <Screen />
    </AdminGuard>
  );
}
