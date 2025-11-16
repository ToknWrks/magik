// app/conspiracies/[slug]/conspiracy-content.tsx
'use client';

import { useEffect, useState } from 'react';
import { Boundary } from '@/components/ui/boundary';
import { ConspiracySkeleton } from '@/components/ui/conspiracy-skeleton';
import ReactMarkdown from 'react-markdown';  // Change import

interface ConspiracyContentProps {
  slug: string;
}

export function ConspiracyContent({ slug }: ConspiracyContentProps) {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateContent();
  }, [slug]);

  const generateContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/conspiracies/generate/${slug}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setContent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ConspiracySkeleton />;
  }

  if (error) {
    return (
      <Boundary label="Error">
        <div className="text-red-600 dark:text-red-400">
          {error}
        </div>
      </Boundary>
    );
  }

  if (!content) {
    return (
      <Boundary label="No Content">
        <div className="text-gray-600 dark:text-gray-400">
          No content available.
        </div>
      </Boundary>
    );
  }

  return (
    <Boundary label="Conspiracy Theory">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {content.title || 'Generated Conspiracy'}
        </h1>
        
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <ReactMarkdown>{content.content || ''}</ReactMarkdown>
        </div>

        {content.debunking && (
          <>
            <hr className="my-8 border-gray-300 dark:border-gray-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Reality Check
            </h2>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <ReactMarkdown>{content.debunking || ''}</ReactMarkdown>
            </div>
          </>
        )}

        {content.sources && content.sources.length > 0 && (
          <>
            <hr className="my-8 border-gray-300 dark:border-gray-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Sources
            </h2>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              {content.sources.map((source: string, index: number) => (
                <li key={index}>{source}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Boundary>
  );
}