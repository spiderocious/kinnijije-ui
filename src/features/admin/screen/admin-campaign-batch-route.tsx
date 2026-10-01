import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-campaign-batch-screen';

export default function AdminCampaignBatchRoute() {
  return (
    <AdminGuard scope="emails:read">
      <Screen />
    </AdminGuard>
  );
}
