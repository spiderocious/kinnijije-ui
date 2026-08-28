import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-recipe-detail-screen';

export default function AdminRecipeDetailRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
