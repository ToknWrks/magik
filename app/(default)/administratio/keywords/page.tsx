// app/administratio/keywords/page.tsx
'use client';

import { useState, useEffect } from 'react';

interface KeywordMapping {
  id: string;
  keyword: string;
  target_slug: string;
  target_type: 'mystery' | 'enlightenment' | 'conspiracy';
}

export default function KeywordsAdmin() {
  const [mappings, setMappings] = useState<KeywordMapping[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newType, setNewType] = useState<'mystery' | 'enlightenment' | 'conspiracy'>('mystery');

  useEffect(() => {
    fetchMappings();
  }, []);

  const fetchMappings = async () => {
    const res = await fetch('/api/admin/keywords');
    const data = await res.json();
    setMappings(data.mappings || []);
  };

  const addMapping = async () => {
    if (!newKeyword || !newSlug) return;
    
    // Build full path
    const path = newType === 'enlightenment' ? '/enlightenment/' : '/mysteries/';
    const fullSlug = newSlug.startsWith('/') ? newSlug : path + newSlug;
    
    await fetch('/api/admin/keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyword: newKeyword,
        target_slug: fullSlug,
        target_type: newType,
      }),
    });
    
    setNewKeyword('');
    setNewSlug('');
    fetchMappings();
  };

  const deleteMapping = async (id: string) => {
    await fetch(`/api/admin/keywords/${id}`, {
      method: 'DELETE',
    });
    fetchMappings();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Keyword Mappings</h1>
      
      {/* Add new mapping */}
      <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
        <h2 className="font-semibold mb-3">Add Keyword Mapping</h2>
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Keyword (e.g., illuminati)"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <input
            type="text"
            placeholder="Target slug (e.g., illuminati-history)"
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as 'mystery' | 'enlightenment' | 'conspiracy')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="mystery">Mysteries (/mysteries/)</option>
            <option value="conspiracy">Conspiracies (/mysteries/)</option>
            <option value="enlightenment">Enlightenment (/enlightenment/)</option>
          </select>
          <button
            onClick={addMapping}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            disabled={!newKeyword || !newSlug}
          >
            Add
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          The full path will be automatically generated: /mysteries/{newSlug} or /enlightenment/{newSlug}
        </p>
      </div>

      {/* Existing mappings */}
      <div className="space-y-2">
        <h2 className="font-semibold mb-3">Current Mappings</h2>
        {mappings.map((mapping) => (
          <div key={mapping.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">
                {mapping.keyword}
              </span>
              <span className="text-gray-500 dark:text-gray-400">→</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {mapping.target_slug}
              </span>
            </div>
            <button
              onClick={() => deleteMapping(mapping.id)}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              title="Delete mapping"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
        
        {mappings.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No keyword mappings yet. Add some above to enable auto-linking.
          </div>
        )}
      </div>
    </div>
  );
}