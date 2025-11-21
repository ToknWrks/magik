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
  const [useManual, setUseManual] = useState(false);

  useEffect(() => {
    generateContent();
  }, [slug, useManual]);

  const generateContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if template has manual content
      const templateResponse = await fetch(`/api/conspiracies/template/${slug}`);
      const template = await templateResponse.json();

      // Check if active
      if (!template.is_active) {
        setError('This conspiracy template is not active.');
        return;
      }

      // Then check content type
      if (template.content_type === 'manual' && template.article_content) {
        // Use manual content
        setContent({
          title: template.title,
          body: template.article_content,
          debunking: template.debunking_points?.join('\n'),
          sources: template.sources,
        });
        return;
      } else {
        // Generate AI content
        const response = await fetch(`/api/conspiracies/generate/${slug}`, {
          method: 'POST',
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        let content = data;
        if (data.cached) {
          try {
            const parsed = JSON.parse(data.body);
            content = { ...data, body: parsed.body, title: parsed.title, sources: parsed.sources };
          } catch (e) {
            // If not JSON, use as is
          }
        }

        setContent(content);
      }
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
        
        <div className="prose prose-gray dark:text-gray-400 max-w-none">
          <ReactMarkdown>{content.content || content.body || ''}</ReactMarkdown>
        </div>

        {content.debunking && (
          <>
            <hr className="my-8 border-gray-300 dark:border-gray-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Reality Check
            </h2>
            <div className="prose prose-gray dark:text-yellow-700 max-w-none">
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