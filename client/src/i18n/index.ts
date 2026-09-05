import { SupportedLanguage, TranslationDictionary } from './types';
import { en } from './en';
import { kn } from './kn';
import { hi } from './hi';
import { ta } from './ta';
import { te } from './te';

export type { SupportedLanguage, TranslationDictionary };

export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  en,
  kn,
  hi,
  ta,
  te,
};

/**
 * Fast, type-safe translation resolver with automatic fallback to English
 * Never returns undefined or raw key paths.
 */
export function getTranslation(
  lang: SupportedLanguage,
  path: string,
  params?: Record<string, string | number>
): string {
  const activeDict = translations[lang] || translations.en;
  const fallbackDict = translations.en;

  const resolve = (dict: any, p: string): any => {
    const parts = p.split('.');
    let current = dict;
    for (const part of parts) {
      if (!current || typeof current !== 'object') return undefined;
      current = current[part];
    }
    return typeof current === 'string' ? current : undefined;
  };

  let template = resolve(activeDict, path);
  if (!template) {
    template = resolve(fallbackDict, path);
  }
  if (!template) {
    const lastPart = path.split('.').pop() || path;
    return lastPart.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).trim();
  }

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      template = template.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }
  }

  return template;
}
