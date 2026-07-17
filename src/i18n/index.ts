import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import en from './en.json';
import ru from './ru.json';
import fr from './fr.json';
import es from './es.json';
import zh from './zh.json';
import ja from './ja.json';
import de from './de.json';
import pt from './pt.json';
import ar from './ar.json';
import type { Language } from '../types';

export const SUPPORTED_LANGUAGES: Language[] = [
  'en',
  'ar',
  'zh',
  'fr',
  'de',
  'ja',
  'pt',
  'ru',
  'es',
];

export function getDeviceLanguage(): Language {
  try {
    const constants = I18nManager.getConstants();
    const { localeIdentifier } = constants;
    if (localeIdentifier) {
      const lang = localeIdentifier.replace(/[_-].*$/, '').toLowerCase();
      if (SUPPORTED_LANGUAGES.includes(lang as Language)) {
        return lang as Language;
      }
    }
  } catch {
    // Fall through to default
  }
  return 'en';
}

function getInitialLanguage(): Language {
  try {
    const storage = new MMKV({ id: 'settings' });
    const raw = storage.getString('userSettings');
    if (raw) {
      const settings = JSON.parse(raw);
      if (
        settings?.language &&
        SUPPORTED_LANGUAGES.includes(settings.language as Language)
      ) {
        return settings.language as Language;
      }
    }
  } catch {
    // Corrupted storage or first launch — use device language
  }
  return getDeviceLanguage();
}

export function changeLanguage(lang: Language): void {
  i18n.changeLanguage(lang);
}

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
    ru: { translation: ru },
    fr: { translation: fr },
    es: { translation: es },
    zh: { translation: zh },
    ja: { translation: ja },
    de: { translation: de },
    pt: { translation: pt },
    ar: { translation: ar },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
export { useTranslation } from 'react-i18next';
