import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-scripts-screen';

export default function AdminScriptsRoute() {
  return (
    <AdminGuard scope="scripts:read">
      <Screen />
    </AdminGuard>
  );
}
