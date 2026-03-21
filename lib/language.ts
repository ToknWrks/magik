export const LANGUAGES = [
  { code: 'en', label: 'English',            nativeLabel: 'English'    },
  { code: 'es', label: 'Spanish',            nativeLabel: 'Español'    },
  { code: 'fr', label: 'French',             nativeLabel: 'Français'   },
  { code: 'de', label: 'German',             nativeLabel: 'Deutsch'    },
  { code: 'pt', label: 'Portuguese',         nativeLabel: 'Português'  },
  { code: 'it', label: 'Italian',            nativeLabel: 'Italiano'   },
  { code: 'nl', label: 'Dutch',              nativeLabel: 'Nederlands' },
  { code: 'ja', label: 'Japanese',           nativeLabel: '日本語'      },
  { code: 'zh', label: 'Chinese (Simplified)', nativeLabel: '中文'      },
  { code: 'ko', label: 'Korean',             nativeLabel: '한국어'      },
  { code: 'ar', label: 'Arabic',             nativeLabel: 'العربية'    },
];

export function getLanguageLabel(code: string): string {
  return LANGUAGES.find(l => l.code === code)?.label ?? 'English';
}

export function languagePromptSuffix(code: string): string {
  if (!code || code === 'en') return '';
  const label = getLanguageLabel(code);
  return `\n\nIMPORTANT: Write the entire response in ${label}. All section headings and body text must be in ${label}.`;
}
