import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface AppExtra {
  apiBaseUrl?: string;
  umamiHost?: string;
  umamiWebsiteId?: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as AppExtra;

export const API_BASE_URL = extra.apiBaseUrl ?? 'https://lbxmb.fr';
export const UMAMI_HOST = extra.umamiHost ?? 'https://analytics.lbxmb.fr';
export const UMAMI_WEBSITE_ID = extra.umamiWebsiteId ?? '';

/**
 * Stable User-Agent for every outbound request.
 *
 * Cloudflare WAF allows the QR auth routes when this exact pattern is present
 * (`LBXMB-App/x.y.z (Android|iOS)`). Keep Android/iOS capitalised.
 */
const PLATFORM_LABEL =
  Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : Platform.OS;

export const APP_USER_AGENT = `LBXMB-App/${Constants.expoConfig?.version ?? '1.0.0'} (${PLATFORM_LABEL})`;

/** Public pages of the website, linked from the app. */
export const WEB_URLS = {
  home: API_BASE_URL,
  privacy: `${API_BASE_URL}/legal/rgpd`,
  terms: `${API_BASE_URL}/legal/cgu`,
  legalNotice: `${API_BASE_URL}/legal/mentions`,
  apiDocs: `${API_BASE_URL}/api`,
  forum: `${API_BASE_URL}/forum`,
  resource: (id: string) => `${API_BASE_URL}/ressources/${encodeURIComponent(id)}`,
} as const;

export const REQUEST_TIMEOUT_MS = 15_000;
