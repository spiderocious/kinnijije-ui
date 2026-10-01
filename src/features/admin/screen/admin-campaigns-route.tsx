import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-campaigns-screen';

export default function AdminCampaignsRoute() {
  return (
    <AdminGuard scope="emails:read">
      <Screen />
    </AdminGuard>
  );
}
