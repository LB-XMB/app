import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { trackScreen } from '@/services/analytics';

/** Reports a screen view every time the screen gains focus. */
export function useScreenTracking(path: string): void {
  useFocusEffect(
    useCallback(() => {
      trackScreen(path);
    }, [path])
  );
}
