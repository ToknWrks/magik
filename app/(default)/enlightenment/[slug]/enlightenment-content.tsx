// app/(default)/enlightenment/[slug]/enlightenment-content.tsx
'use client';

import { useEffect, useState } from 'react';
import { Boundary } from '@/components/ui/boundary';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import ShareToX from '@/components/ShareToX';

interface EnlightenmentContentProps {
  slug: string;
}

export function EnlightenmentContent({ slug }: EnlightenmentContentProps) {
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
      
      // Check if template has manual content
      const templateResponse = await fetch(`/api/enlightenment/template/${slug}`);
      
      if (!templateResponse.ok) {
        throw new Error('Teaching not found');
      }
      
      const template = await templateResponse.json();

      if (!template.is_active) {
        setError('This teaching is not currently available.');
        return;
      }

      if (template.content_type === 'manual' && template.article_content) {
        setContent({
          title: template.title,
          body: template.article_content,
          sources: template.sources,
          key_teachings: template.key_teachings,
          spiritual_practices: template.spiritual_practices,
        });
        return;
      }

      // Generate AI content
      const response = await fetch(`/api/enlightenment/generate/${slug}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate content`);
      }
      
      const data = await response.json();
      setContent({
        ...data,
        key_teachings: template.key_teachings,
        spiritual_practices: template.spiritual_practices,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Boundary label="Loading...">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </Boundary>
    );
  }

  if (error) {
    return (
      <Boundary label="Error">
        <div className="text-center py-12">
          <div className="text-gray-700 dark:text-gray-300 mb-4">{error}</div>
          <Link 
            href="/enlightenment" 
            className="text-amber-600 dark:text-amber-400 hover:underline"
          >
            ← Back to Teachings
          </Link>
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
    <Boundary label="Enlightenment">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link 
          href="/enlightenment" 
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 mb-6 inline-flex items-center gap-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Teachings
        </Link>

        {/* Title & Share */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mt-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
            {content.title}
          </h1>
          <ShareToX 
            title={content.title} 
            hashtags={['realilluminati', 'enlightenment', 'wisdom', 'spirituality']}
          />
        </div>

        {/* Key Teachings */}
        {content.key_teachings?.length > 0 && (
          <div className="mb-8 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              Key Teachings
            </h3>
            <ul className="space-y-2">
              {content.key_teachings.map((teaching: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-amber-500 mt-0.5">•</span>
                  {teaching}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Main Content */}
        <article className="prose-article">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-10 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-6 mb-3">
                  {children}
                </h3>
              ),
              h4: ({ children }) => (
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2">
                  {children}
                </h4>
              ),
              p: ({ children }) => (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  {children}
                </p>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-gray-900 dark:text-gray-100">
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className="italic text-gray-700 dark:text-gray-300">
                  {children}
                </em>
              ),
              a: ({ href, children }) => (
                <a 
                  href={href} 
                  className="text-amber-600 dark:text-amber-400 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
              ul: ({ children }) => (
                <ul className="my-4 ml-4 space-y-2">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="my-4 ml-4 space-y-2 list-decimal">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
                  <span className="text-amber-500 mt-1.5">•</span>
                  <span>{children}</span>
                </li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="my-6 pl-4 border-l-4 border-amber-500 bg-gray-50 dark:bg-gray-800/50 py-3 pr-4 rounded-r-lg">
                  <div className="italic text-gray-600 dark:text-gray-400">
                    {children}
                  </div>
                </blockquote>
              ),
              hr: () => (
                <hr className="my-8 border-gray-200 dark:border-gray-700" />
              ),
              code: ({ children }) => (
                <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm text-gray-800 dark:text-gray-200">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="my-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
                  {children}
                </pre>
              ),
            }}
          >
            {content.body || ''}
          </ReactMarkdown>
        </article>

        {/* Spiritual Practices */}
        {content.spiritual_practices?.length > 0 && (
          <div className="mt-10 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              Spiritual Practices
            </h3>
            <ul className="space-y-2">
              {content.spiritual_practices.map((practice: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-amber-500 mt-0.5">•</span>
                  {practice}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sources */}
        {content.sources?.length > 0 && (
          <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              Sources & Further Reading
            </h3>
            <ul className="space-y-1">
              {content.sources.map((source: string, i: number) => (
                <li key={i} className="text-sm text-gray-600 dark:text-gray-400">
                  {source}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link 
            href="/enlightenment" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Explore More Teachings
          </Link>
          <ShareToX 
            title={content.title} 
            hashtags={['realilluminati', 'enlightenment', 'wisdom', 'spirituality']}
          />
        </div>
      </div>
    </Boundary>
  );
}