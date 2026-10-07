import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-matching-test-screen';

export default function AdminMatchingTestRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
