import { mapIncomingPath } from '@/services/deepLinks';

/**
 * Remaps system / universal-link URLs before Expo Router resolves them.
 * @see https://docs.expo.dev/router/advanced/native-intent/
 */
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): string {
  try {
    return mapIncomingPath(path);
  } catch {
    return '/';
  }
}
