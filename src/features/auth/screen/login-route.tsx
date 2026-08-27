import { GuestOnly } from '../parts/route-guard';
import LoginScreen from './login-screen';

/**
 * Someone already signed in has no business on the sign-in page — GuestOnly
 * moves them along to wherever they actually belong.
 */
export default function LoginRoute() {
  return (
    <GuestOnly>
      <LoginScreen />
    </GuestOnly>
  );
}
