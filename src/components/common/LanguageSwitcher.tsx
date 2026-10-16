/**
 * Language Switcher Component
 * Toggle between English and Arabic
 */

import { useTranslation, type Language } from '@/i18n';

export function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();

  const toggleLanguage = () => {
    const newLang: Language = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="touch-target px-3 py-2 text-sm font-medium text-neutral-700 hover:text-primary-600 transition-smooth rounded-lg hover:bg-neutral-100"
      aria-label="Switch language"
    >
      {language === 'en' ? 'العربية' : 'English'}
    </button>
  );
}
