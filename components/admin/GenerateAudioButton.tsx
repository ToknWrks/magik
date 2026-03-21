'use client';

import { useState } from 'react';

interface Props {
  contentId: string;
  contentType: 'enlightenment' | 'mystery';
  text: string;
  existingUrl?: string | null;
  onGenerated?: (url: string) => void;
}

export default function GenerateAudioButton({ contentId, contentType, text, existingUrl, onGenerated }: Props) {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState(existingUrl ?? null);
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, contentId, contentType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setUrl(data.audioUrl);
      onGenerated?.(data.audioUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {url ? (
        <>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 dark:text-green-400 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
            title="Play audio"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </a>
          <button
            onClick={generate}
            disabled={loading}
            className="text-gray-400 hover:text-amber-500 dark:text-gray-500 dark:hover:text-amber-400 p-1 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20"
            title="Regenerate audio"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </>
      ) : (
        <button
          onClick={generate}
          disabled={loading}
          className="text-gray-400 hover:text-amber-500 dark:text-gray-500 dark:hover:text-amber-400 p-1 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20"
          title="Generate audio"
        >
          {loading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>
      )}
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
}
