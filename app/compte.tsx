import { SignInView } from '@/components/auth/SignInView';
import { useScreenTracking } from '@/hooks/useScreenTracking';

/** Sign-in screen reached later on, from the profile tab. */
export default function AccountScreen() {
  useScreenTracking('/compte');
  return <SignInView mode="standalone" />;
}
