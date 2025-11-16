// app/conspiracies/[slug]/conspiracy-detail-client.tsx
'use client';

import { useEffect, useState } from 'react';
import { Boundary } from '@/components/ui/boundary';
import { marked } from 'marked';  // Add import

interface ConspiracyDetailClientProps {
  slug: string;
}

export function ConspiracyDetailClient({ slug }: ConspiracyDetailClientProps) {
  const [conspiracy, setConspiracy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConspiracy = async () => {
      try {
        const response = await fetch(`/api/conspiracies/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setConspiracy(data);
        } else {
          setError('Conspiracy not found.');
        }
      } catch (error) {
        console.error('Error fetching conspiracy:', error);
        setError('Failed to load conspiracy.');
      } finally {
        setLoading(false);
      }
    };

    fetchConspiracy();
  }, [slug]);

  if (loading) {
    return (
      <Boundary label="Loading">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      </Boundary>
    );
  }

  if (error || !conspiracy) {
    return (
      <Boundary label="Error">
        <div className="text-red-600 dark:text-red-400">
          {error || 'Conspiracy not found.'}
        </div>
      </Boundary>
    );
  }

  return (
    <Boundary label="Conspiracy Theory">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {conspiracy.title}
        </h1>
        
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: marked(conspiracy.content || '') }} />
        </div>

        {conspiracy.debunking && (
          <>
            <hr className="my-8 border-gray-300 dark:border-gray-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Reality Check
            </h2>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: marked(conspiracy.debunking || '') }} />
            </div>
          </>
        )}

        {conspiracy.sources && conspiracy.sources.length > 0 && (
          <>
            <hr className="my-8 border-gray-300 dark:border-gray-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Sources
            </h2>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              {conspiracy.sources.map((source: string, index: number) => (
                <li key={index}>{source}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Boundary>
  );
}