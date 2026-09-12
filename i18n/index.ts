import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import fr from './locales/fr.json';

import { useSettingsStore } from '@/stores/settings';

function deviceLanguage(): 'fr' | 'en' {
  const code = Localization.getLocales()[0]?.languageCode?.toLowerCase();
  return code === 'en' ? 'en' : 'fr';
}

export function resolveLanguage(preference: 'system' | 'fr' | 'en'): 'fr' | 'en' {
  if (preference === 'system') return deviceLanguage();
  return preference;
}

void i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: resolveLanguage(useSettingsStore.getState().language),
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

let previousLanguage = useSettingsStore.getState().language;
useSettingsStore.subscribe((state) => {
  if (state.language === previousLanguage) return;
  previousLanguage = state.language;
  void i18n.changeLanguage(resolveLanguage(state.language));
});

export { i18n };
