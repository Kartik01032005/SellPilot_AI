'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { SupportedLanguage, getTranslation } from '@/i18n';

export type { SupportedLanguage };

const LANGUAGE_STORAGE_KEY = 'sellpilot_language';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  languageNames: Record<SupportedLanguage, { label: string; native: string; sample: string }>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const languageNames: Record<SupportedLanguage, { label: string; native: string; sample: string }> = {
  en: { label: 'English', native: 'English', sample: 'I need running shoes under 3000' },
  kn: { label: 'Kannada', native: 'ಕನ್ನಡ', sample: 'nanage running shoes beku under 3000' },
  hi: { label: 'Hindi', native: 'हिन्दी', sample: 'mujhe running shoes chahiye under 3000' },
  ta: { label: 'Tamil', native: 'தமிழ்', sample: 'enakku running shoe venum under 3000' },
  te: { label: 'Telugu', native: 'తెలుగు', sample: 'naaku running shoes kavali under 3000' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored && (stored === 'en' || stored === 'kn' || stored === 'hi' || stored === 'ta' || stored === 'te')) {
        setLanguageState(stored as SupportedLanguage);
      }
    } catch {
      // Ignore localStorage read errors in private browsing/SSR
    }
  }, []);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Ignore localStorage write errors
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return getTranslation(language, key, params);
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, languageNames, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
