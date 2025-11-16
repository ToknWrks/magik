// app/seed/page.tsx
'use client';

import { useState } from 'react';

export default function SeedPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runSeed = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/seed', { method: 'POST' });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Failed to seed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Seeding</h1>
      <p className="mb-4 text-gray-600 dark:text-gray-400">
        Click the button below to populate your database with conspiracy theory templates.
      </p>
      
      <button
        onClick={runSeed}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Seeding...' : 'Seed Database'}
      </button>

      {result && (
        <pre className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}