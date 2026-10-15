import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '../i18n/translations';
import { apiRequest } from '../api/client';
import { Platform } from 'react-native';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: async () => {},
  t: translations.en,
});

const isWeb = Platform.OS === 'web';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Restore cached language preference
    const loadSavedLang = async () => {
      try {
        if (isWeb && typeof window !== 'undefined' && window.localStorage) {
          const saved = window.localStorage.getItem('cropcare_lang') as Language;
          if (saved && (saved === 'en' || saved === 'si' || saved === 'ta')) {
            setLanguageState(saved);
          }
        }
      } catch (e) {
        console.warn('Failed to load local language:', e);
      }
    };
    loadSavedLang();
  }, []);

  const setLanguage = async (newLang: Language) => {
    setLanguageState(newLang);
    try {
      if (isWeb && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('cropcare_lang', newLang);
      }
      // Also try syncing with backend if authenticated
      await apiRequest('/api/preferences', {
        method: 'PUT',
        body: { language: newLang },
      });
    } catch (e) {
      console.warn('Failed to persist language preference:', e);
    }
  };

  const t = translations[language] || translations.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
