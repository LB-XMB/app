import Constants from 'expo-constants';

interface AppExtra {
  apiBaseUrl?: string;
  umamiHost?: string;
  umamiWebsiteId?: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as AppExtra;

export const API_BASE_URL = extra.apiBaseUrl ?? 'https://lbxmb.fr';
export const UMAMI_HOST = extra.umamiHost ?? 'https://analytics.lbxmb.fr';
export const UMAMI_WEBSITE_ID = extra.umamiWebsiteId ?? '';

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
