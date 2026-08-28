import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-ai-screen';

export default function AdminAiRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
