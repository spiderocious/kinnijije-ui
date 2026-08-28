import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-recipe-new-screen';

export default function AdminRecipeNewRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
