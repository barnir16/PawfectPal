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

  const resolveTranslation = (locale: Record<string, any>, key: string): string | null => {
    const keys = key.split('.');
    let value: any = locale;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return null;
      }
    }

    return typeof value === 'string' ? value : null;
  };

  const t = (key: string): string => {
    const localizedValue = resolveTranslation(getLocaleData(), key);
    if (localizedValue) {
      return localizedValue;
    }

    const fallbackValue = resolveTranslation(en, key);
    if (fallbackValue) {
      console.warn(`Translation key missing in ${currentLanguage}, using English fallback: ${key}`);
      return fallbackValue;
    }

    console.warn(`Translation key not found: ${key}`);
    const lastSegment = key.split('.').pop();
    if (lastSegment) {
      return lastSegment;
    }

    return key;
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
