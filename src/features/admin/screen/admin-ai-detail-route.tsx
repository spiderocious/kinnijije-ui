import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-ai-detail-screen';

export default function AdminAiDetailRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
