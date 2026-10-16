/**
 * Internationalization (i18n) System
 * Simple lightweight i18n implementation for English and Arabic
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import enTranslations from './en.json';
import arTranslations from './ar.json';
import { STORAGE_KEYS } from '@/utils/constants';

export type Language = 'en' | 'ar';
export type Translations = typeof enTranslations;

const translations: Record<Language, Translations> = {
  en: enTranslations,
  ar: arTranslations,
};

interface I18nContextType {
  language: Language;
  t: (key: string) => string;
  setLanguage: (lang: Language) => void;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

/**
 * Get translation by dot-notation key
 * e.g., t('auth.login') => 'Login'
 */
function getTranslation(translations: Translations, key: string): string {
  const keys = key.split('.');
  let value: any = translations;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Return key if translation not found
      return key;
    }
  }

  return typeof value === 'string' ? value : key;
}

/**
 * Get browser's preferred language
 */
function getBrowserLanguage(): Language {
  const browserLang = navigator.language.toLowerCase();
  
  if (browserLang.startsWith('ar')) {
    return 'ar';
  }
  
  return 'en';
}

/**
 * Get stored language preference or browser language
 */
function getInitialLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
  
  if (stored === 'en' || stored === 'ar') {
    return stored;
  }
  
  return getBrowserLanguage();
}

/**
 * I18n Provider Component
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  // Update document direction and lang attribute
  useEffect(() => {
    const dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  // Translation function
  const t = (key: string): string => {
    return getTranslation(translations[language], key);
  };

  // Set language and persist to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <I18nContext.Provider value={{ language, t, setLanguage, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * useTranslation Hook
 * Access translation function and language settings
 */
export function useTranslation() {
  const context = useContext(I18nContext);

  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }

  return context;
}

/**
 * Hook shorthand - just get the translation function
 */
export function useT() {
  const { t } = useTranslation();
  return t;
}
