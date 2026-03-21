'use client';

import { useState, useEffect } from 'react';
import { LANGUAGES } from '@/lib/language';

export { LANGUAGES, getLanguageLabel, languagePromptSuffix } from '@/lib/language';

const STORAGE_KEY = 'preferred_language';

export function useLanguage() {
  const [language, setLanguageState] = useState<string>('en');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && LANGUAGES.some(l => l.code === stored)) {
        setLanguageState(stored);
      }
    } catch { /* ignore */ }
  }, []);

  const setLanguage = (code: string) => {
    setLanguageState(code);
    try { localStorage.setItem(STORAGE_KEY, code); } catch { /* ignore */ }
  };

  return { language, setLanguage };
}
