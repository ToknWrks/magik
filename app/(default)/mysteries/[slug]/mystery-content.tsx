// app/conspiracies/[slug]/conspiracy-content.tsx
'use client';

import { useEffect, useState } from 'react';
import { Boundary } from '@/components/ui/boundary';
import { ConspiracySkeleton } from '@/components/ui/conspiracy-skeleton';
import ReactMarkdown from 'react-markdown';  // Change import
import BgImage from './bg-image';

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
    
    <Boundary label="Illuminati Mysteries">
    <div className="space-y-4 relative">
      
      <div className="relative z-10">
        <h1 className="pl-5 text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {content.title || 'Mystery Content'}
        </h1>
        
        <div className="p-5 prose text-gray-800 dark:text-gray-400 max-w-none
            prose-p:text-gray-700 dark:prose-p:text-gray-300
            prose-strong:text-gray-900 dark:prose-strong:text-gray-100
            prose-a:text-gray-900 dark:prose-a:text-gray-100
            prose-li:text-gray-700 dark:prose-li:text-gray-300
            prose-headings:text-gray-900 dark:prose-headings:text-gray-100">

          <ReactMarkdown>{content.content || content.body || ''}</ReactMarkdown>
        </div>

       
      </div>
    </div>
  </Boundary>
);
}