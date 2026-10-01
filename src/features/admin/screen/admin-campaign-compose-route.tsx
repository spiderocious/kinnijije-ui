import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-campaign-compose-screen';

export default function AdminCampaignComposeRoute() {
  return (
    <AdminGuard scope="emails:read">
      <Screen />
    </AdminGuard>
  );
}
