import Constants from 'expo-constants';
import { Dimensions, Platform } from 'react-native';

import { UMAMI_HOST, UMAMI_WEBSITE_ID } from '@/services/api';
import { useSettingsStore } from '@/stores/settings';

/**
 * Minimal Umami client.
 *
 * Nothing is ever sent unless the user explicitly picked "full" on the consent
 * screen, and no identifier is attached: Umami derives an anonymous visitor
 * hash server-side.
 */

const HOSTNAME = 'app.lbxmb.fr';
const USER_AGENT = `LBXMB-App/${Constants.expoConfig?.version ?? '1.0.0'} (${Platform.OS})`;

interface UmamiPayload {
  website: string;
  hostname: string;
  screen: string;
  language: string;
  url: string;
  referrer?: string;
  name?: string;
  data?: Record<string, string | number | boolean>;
}

function isEnabled(): boolean {
  if (!UMAMI_WEBSITE_ID) return false;
  return useSettingsStore.getState().consent === 'full';
}

async function send(type: 'event', payload: UmamiPayload): Promise<void> {
  if (!isEnabled()) return;
  try {
    await fetch(`${UMAMI_HOST}/api/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
      },
      body: JSON.stringify({ type, payload }),
    });
  } catch {
    // Analytics must never interfere with the app.
  }
}

function basePayload(url: string): UmamiPayload {
  const { width, height } = Dimensions.get('window');
  return {
    website: UMAMI_WEBSITE_ID,
    hostname: HOSTNAME,
    screen: `${Math.round(width)}x${Math.round(height)}`,
    language: 'fr',
    url,
  };
}

/** Records a screen view. `path` mimics a web route, e.g. `/catalogue`. */
export function trackScreen(path: string): void {
  void send('event', basePayload(path));
}

/** Records a named interaction, optionally attached to the current screen. */
export function trackEvent(
  name: string,
  data?: Record<string, string | number | boolean>,
  path = '/'
): void {
  void send('event', { ...basePayload(path), name, data });
}
