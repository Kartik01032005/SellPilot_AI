'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type SupportedLanguage = 'en' | 'kn' | 'hi' | 'ta' | 'te';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  languageNames: Record<SupportedLanguage, { label: string; native: string; sample: string }>;
}

const languageNames: Record<SupportedLanguage, { label: string; native: string; sample: string }> = {
  en: { label: 'English', native: 'English', sample: 'I need running shoes under 3000' },
  kn: { label: 'Kannada', native: 'ಕನ್ನಡ (Romanized)', sample: 'nanage running shoes beku under 3000' },
  hi: { label: 'Hindi', native: 'हिंदी (Romanized)', sample: 'mujhe running shoes chahiye under 3000' },
  ta: { label: 'Tamil', native: 'தமிழ் (Romanized)', sample: 'enakku running shoe venum under 3000' },
  te: { label: 'Telugu', native: 'తెలుగు (Romanized)', sample: 'naaku running shoes kavali under 3000' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<SupportedLanguage>('en');

  return (
    <LanguageContext.Provider value={{ language, setLanguage, languageNames }}>
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
