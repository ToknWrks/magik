// app/(default)/mysteries/[slug]/mystery-content.tsx
'use client';

import { useEffect, useState } from 'react';
import { Boundary } from '@/components/ui/boundary';
import Link from 'next/link';
import ShareToX from '@/components/ShareToX';
import AutoLinkMarkdown from '@/components/AutoLinkMarkdown';
import Script from 'next/script';

interface MysteryContentProps {
  slug: string;
}

export function MysteryContent({ slug }: MysteryContentProps) {
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
      
      const templateResponse = await fetch(`/api/conspiracies/template/${slug}`);
      
      if (!templateResponse.ok) {
        throw new Error('Mystery not found');
      }
      
      const template = await templateResponse.json();

      if (!template.is_active) {
        setError('This mystery is not currently available.');
        return;
      }

      if (template.content_type === 'manual' && template.article_content) {
        setContent({
          title: template.title,
          body: template.article_content,
          sources: template.sources,
          key_facts: template.key_facts,
          debunking_points: template.debunking_points,
          created_at: template.created_at,
          updated_at: template.updated_at,
        });
        return;
      }

      const response = await fetch(`/api/conspiracies/generate/${slug}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate content`);
      }
      
      const data = await response.json();
      setContent({
        ...data,
        key_facts: template.key_facts,
        debunking_points: template.debunking_points,
        sources: template.sources,
        created_at: template.created_at,
        updated_at: template.updated_at,
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
            href="/mysteries" 
            className="text-amber-600 dark:text-amber-400 hover:underline"
          >
            ← Back to Mysteries
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

  // Structured Data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: content.title,
    description: content.description || `Explore the mystery of ${content.title}`,
    author: {
      '@type': 'Organization',
      name: 'Real Illuminati',
      url: 'https://illuminati.earth'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Real Illuminati',
      logo: {
        '@type': 'ImageObject',
        url: 'https://illuminati.earth/images/illuminati-logo.png'
      }
    },
    datePublished: content.created_at,
    dateModified: content.updated_at,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://illuminati.earth/mysteries/${slug}`
    },
    articleSection: 'Mysteries',
    keywords: ['mysteries', 'conspiracy theories', 'unexplained phenomena', 'historical enigmas'],
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://illuminati.earth'
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Mysteries',
          item: 'https://illuminati.earth/mysteries'
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: content.title,
          item: `https://illuminati.earth/mysteries/${slug}`
        }
      ]
    }
  };

  return (
    <>
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      
      <Boundary label="Illuminati Mysteries">
        <div className="max-w-4xl mx-auto">
          {/* Back Link */}
          <Link 
            href="/mysteries" 
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 mb-6 inline-flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Mysteries
          </Link>

          {/* Title & Share */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mt-4 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
              {content.title}
            </h1>
            <ShareToX 
              title={content.title} 
              hashtags={['realilluminati', 'mysteries', 'truth']}
            />
          </div>

          {/* Key Facts */}
          {content.key_facts?.length > 0 && (
            <div className="mb-8 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                Key Facts
              </h3>
              <ul className="space-y-2">
                {content.key_facts.map((fact: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-amber-500 mt-0.5">•</span>
                    {fact}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Main Content with Auto-Links */}
          <article className="prose-article">
            <AutoLinkMarkdown content={content.body || ''} currentSlug={slug} />
          </article>

          {/* Debunking Points */}
          {content.debunking_points?.length > 0 && (
            <div className="mt-10 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                Critical Analysis Points
              </h3>
              <ul className="space-y-2">
                {content.debunking_points.map((point: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-amber-500 mt-0.5">•</span>
                    {point}
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
                Sources & References
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

          {/* Discuss with Solomon */}
          <div className="mt-10 p-5 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-200 dark:border-yellow-800 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
              <img src="/images/illuminati-logo.png" alt="Solomon" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Explore this mystery with Solomon</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Your personal guide — ask questions, dig deeper, or discuss what this mystery means to you.</p>
            </div>
            <button
              onClick={() => {
                try {
                  sessionStorage.setItem('solomon_content_context', JSON.stringify({ title: content.title, type: 'mystery' }));
                } catch { /* ignore */ }
                window.location.href = '/coaching';
              }}
              className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-700 hover:bg-yellow-800 text-white font-medium rounded-xl text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Talk to Solomon
            </button>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              href="/mysteries"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Explore More Mysteries
            </Link>
            <ShareToX
              title={content.title}
              hashtags={['realilluminati', 'mysteries', 'truth']}
            />
          </div>
        </div>
      </Boundary>
    </>
  );
}