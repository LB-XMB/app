import { Dimensions } from 'react-native';

import { APP_CLIENT_HEADER, APP_USER_AGENT, UMAMI_HOST, UMAMI_WEBSITE_ID } from '@/services/api';
import { useSettingsStore } from '@/stores/settings';

/**
 * Minimal Umami client.
 *
 * Nothing is ever sent unless the user explicitly picked "full" on the consent
 * screen, and no identifier is attached: Umami derives an anonymous visitor
 * hash server-side.
 */

const HOSTNAME = 'app.lbxmb.fr';

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
        'User-Agent': APP_USER_AGENT,
        'X-LBXMB-Client': APP_CLIENT_HEADER,
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
