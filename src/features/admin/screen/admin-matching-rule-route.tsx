import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-matching-rule-screen';

export default function AdminMatchingRuleRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
