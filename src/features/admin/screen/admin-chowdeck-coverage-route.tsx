import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-chowdeck-coverage-screen';

export default function AdminChowdeckCoverageRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
