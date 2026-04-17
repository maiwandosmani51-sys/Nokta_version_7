import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { localeMessages } from '@/locales/messages';

type LocaleTree = Record<string, unknown>;
type FlatTranslations = Record<string, string>;

function flattenLocale(source: LocaleTree, prefix = '', flat: FlatTranslations = {}) {
  for (const [key, value] of Object.entries(source)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      flat[nextKey] = value;
      if (!Object.prototype.hasOwnProperty.call(flat, key)) {
        flat[key] = value;
      }
      continue;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenLocale(value as LocaleTree, nextKey, flat);
    }
  }

  return flat;
}

export const languageMeta = {
  en: { dir: 'ltr', label: 'English' },
  fa: { dir: 'rtl', label: 'Dari' },
  ps: { dir: 'rtl', label: 'Pashto' }
} as const;

export type AppLanguage = keyof typeof languageMeta;

export function getLanguageDirection(language?: string) {
  return languageMeta[(language as AppLanguage) || 'en']?.dir ?? 'ltr';
}

export function applyDocumentLanguage(language?: string) {
  const normalized = (language as AppLanguage) || 'en';
  document.documentElement.dir = getLanguageDirection(normalized);
  document.documentElement.lang = normalized;
}

const defaultLanguage = ((localStorage.getItem('lang') as AppLanguage | null) || 'en') as AppLanguage;
applyDocumentLanguage(defaultLanguage);

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: flattenLocale(localeMessages.en as LocaleTree) },
    fa: { translation: flattenLocale(localeMessages.fa as LocaleTree) },
    ps: { translation: flattenLocale(localeMessages.ps as LocaleTree) }
  },
  lng: defaultLanguage,
  fallbackLng: 'en',
  supportedLngs: ['en', 'fa', 'ps'],
  defaultNS: 'translation',
  interpolation: { escapeValue: false },
  returnEmptyString: false
});

export default i18n;
