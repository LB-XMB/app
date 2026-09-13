import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { storage, zustandStorage } from './storage';

export type ThemePreference = 'auto' | 'light' | 'dark';

/**
 * `full`   — anonymous usage analytics (screen views + interactions)
 * `none`   — nothing leaves the device
 * `unset`  — the consent screen has not been answered yet
 */
export type ConsentLevel = 'full' | 'none' | 'unset';

export type CatalogueLayout = 'grid' | 'list';

interface SettingsState {
  theme: ThemePreference;
  consent: ConsentLevel;
  consentDate: string | null;
  catalogueLayout: CatalogueLayout;
  hapticsEnabled: boolean;
  /** Local notification when a queued download finishes. */
  downloadNotifications: boolean;
  /** Poll forum inbox when signed in (opt-in). */
  forumInboxEnabled: boolean;
  /** Require biometrics when returning to the app. */
  appLockEnabled: boolean;
  /** UI language override: system follows device, else force fr/en. */
  language: 'system' | 'fr' | 'en';
  /** Last app version for which the changelog sheet was shown. */
  lastSeenAppVersion: string | null;
  /** Accueil wordmark: kawaii-service-logo instead of the default. */
  kawaiiLogo: boolean;
  setTheme: (theme: ThemePreference) => void;
  setConsent: (consent: Exclude<ConsentLevel, 'unset'>) => void;
  setCatalogueLayout: (layout: CatalogueLayout) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setDownloadNotifications: (enabled: boolean) => void;
  setForumInboxEnabled: (enabled: boolean) => void;
  setAppLockEnabled: (enabled: boolean) => void;
  setLanguage: (language: 'system' | 'fr' | 'en') => void;
  setLastSeenAppVersion: (version: string) => void;
  setKawaiiLogo: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // The design is dark-first, like the website; "auto" stays opt-in.
      theme: 'dark',
      consent: 'unset',
      consentDate: null,
      catalogueLayout: 'grid',
      hapticsEnabled: true,
      downloadNotifications: false,
      forumInboxEnabled: false,
      appLockEnabled: false,
      language: 'system',
      lastSeenAppVersion: null,
      kawaiiLogo: false,
      setTheme: (theme) => set({ theme }),
      setConsent: (consent) => set({ consent, consentDate: new Date().toISOString() }),
      setCatalogueLayout: (catalogueLayout) => set({ catalogueLayout }),
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
      setDownloadNotifications: (downloadNotifications) => set({ downloadNotifications }),
      setForumInboxEnabled: (forumInboxEnabled) => set({ forumInboxEnabled }),
      setAppLockEnabled: (appLockEnabled) => set({ appLockEnabled }),
      setLanguage: (language) => set({ language }),
      setLastSeenAppVersion: (lastSeenAppVersion) => set({ lastSeenAppVersion }),
      setKawaiiLogo: (kawaiiLogo) => set({ kawaiiLogo }),
    }),
    {
      name: 'lbxmb.settings',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

/** True once the user has answered the privacy screen. */
export function hasAnsweredConsent(consent: ConsentLevel): boolean {
  return consent !== 'unset';
}

/**
 * Sync read of the kawaii logo preference before zustand rehydrates.
 * Used by the JS boot splash so the correct mark shows on cold start.
 */
export function readKawaiiLogoPref(): boolean {
  try {
    const raw = storage.getString('lbxmb.settings');
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { state?: { kawaiiLogo?: boolean } };
    return parsed.state?.kawaiiLogo === true;
  } catch {
    return false;
  }
}
