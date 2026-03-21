'use client';

import { LANGUAGES } from '@/lib/language';

interface Props {
  value: string;
  onChange: (code: string) => void;
  className?: string;
}

export default function LanguageSelector({ value, onChange, className = '' }: Props) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`text-xs bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-1 focus:ring-yellow-600 cursor-pointer ${className}`}
    >
      {LANGUAGES.map(l => (
        <option key={l.code} value={l.code}>{l.nativeLabel}</option>
      ))}
    </select>
  );
}
