import { RouteGuard } from '@features/auth';

import Screen from './chat-screen';

export default function ChatRoute() {
  return (
    <RouteGuard>
      <Screen />
    </RouteGuard>
  );
}
