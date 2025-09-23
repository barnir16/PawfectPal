import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LocaleHelper } from '../utils/LocaleHelper';
import { en } from '../locales/en';
import { he } from '../locales/he';

type Language = 'en' | 'he';
type LocaleData = typeof en;

interface LocalizationContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
  getSupportedLanguages: () => { code: string; name: string; flag: string }[];
  isRTL: boolean;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

interface LocalizationProviderProps {
  children: ReactNode;
}

export const LocalizationProvider: React.FC<LocalizationProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<Language>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedLanguage = LocaleHelper.getCurrentLanguage() as Language;
    setCurrentLanguageState(savedLanguage);
    
    // Set initial document direction
    document.documentElement.dir = savedLanguage === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = savedLanguage;
    
    setIsInitialized(true);
  }, []);

  const setLanguage = (language: Language) => {
    LocaleHelper.setNewLocale(language);
    setCurrentLanguageState(language);
    
    // Update document direction for RTL support
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  };

  const getLocaleData = (): LocaleData => {
    switch (currentLanguage) {
      case 'he':
        return he;
      case 'en':
      default:
        return en;
    }
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = getLocaleData();
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key; // Return the key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  const getSupportedLanguages = () => {
    return LocaleHelper.getSupportedLanguages().map(lang => ({
      code: lang,
      name: LocaleHelper.getLanguageDisplayName(lang),
      flag: lang === 'he' ? '🇮🇱' : '🇺🇸',
    }));
  };

  const isRTL = currentLanguage === 'he';

  const value: LocalizationContextType = {
    currentLanguage,
    setLanguage,
    t,
    getSupportedLanguages,
    isRTL,
  };

  if (!isInitialized) {
    return null; // Don't render children until initialized
  }

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};

export default LocalizationProvider;
