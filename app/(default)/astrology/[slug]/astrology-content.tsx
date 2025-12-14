// app/astrology/[slug]/astrology-content.tsx
'use client';

import { useEffect, useState } from 'react';
import { Boundary } from '@/components/ui/boundary';
import Link from 'next/link';
import ShareToX from '@/components/ShareToX';
import AutoLinkMarkdown from '@/components/AutoLinkMarkdown';

interface AstrologyContentProps {
  slug: string;
}

export function AstrologyContent({ slug }: AstrologyContentProps) {
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
      const templateResponse = await fetch(`/api/astrology/template/${slug}`);
      
      if (!templateResponse.ok) {
        throw new Error('Astrological combination not found');
      }
      
      const template = await templateResponse.json();

      if (!template.is_active) {
        setError('This astrological combination is not currently available.');
        return;
      }

      if (template.content_type === 'manual' && template.article_content) {
        setContent({
          title: template.title,
          body: template.article_content,
          category: template.category,
          category2: template.category2,
          archetypal_themes: template.archetypal_themes,
          evidence_points: template.evidence_points,
          counterarguments: template.counterarguments,
        });
        return;
      }

      // Generate AI content
      const response = await fetch(`/api/astrology/generate/${slug}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate astrology content`);
      }
      
      const data = await response.json();
      setContent({
        ...data,
        category: template.category,
        category2: template.category2,
        archetypal_themes: template.archetypal_themes,
        evidence_points: template.evidence_points,
        counterarguments: template.counterarguments,
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
            href="/astrology" 
            className="text-amber-600 dark:text-amber-400 hover:underline"
          >
            ← Back to Astrology Archive
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
    <Boundary label="Archetypal Astrology">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link 
          href="/astrology" 
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 mb-6 inline-flex items-center gap-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Astrology Archive
        </Link>

        {/* Title & Share */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mt-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
            {content.title}
          </h1>
          <ShareToX 
            title={content.title} 
            hashtags={['realilluminati', 'astrology', 'archetypal', 'planets']}
          />
        </div>

        {/* Archetypal Themes */}
        {content.archetypal_themes?.length > 0 && (
          <div className="mb-8 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              Archetypal Themes
            </h3>
            <ul className="space-y-2">
              {content.archetypal_themes.map((theme: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-amber-500 mt-0.5">•</span>
                  {theme}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Main Content with Auto-Links */}
        <article className="prose-article">
          <AutoLinkMarkdown content={content.body || ''} currentSlug={slug} />
        </article>

        {/* Evidence Points */}
        {content.evidence_points?.length > 0 && (
          <div className="mt-10 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              Supporting Evidence
            </h3>
            <ul className="space-y-2">
              {content.evidence_points.map((point: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-amber-500 mt-0.5">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Counterarguments */}
        {content.counterarguments?.length > 0 && (
          <div className="mt-6 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              Alternative Perspectives
            </h3>
            <ul className="space-y-2">
              {content.counterarguments.map((arg: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-amber-500 mt-0.5">•</span>
                  {arg}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link 
            href="/astrology" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Explore More Combinations
          </Link>
          <ShareToX 
            title={content.title} 
            hashtags={['realilluminati', 'astrology', 'archetypal', 'planets']}
          />
        </div>
      </div>
    </Boundary>
  );
}

// Planet symbols helper
function getPlanetSymbol(planet: string): string {
  const symbols: Record<string, string> = {
    'Sun': '☉', 'Moon': '☽', 'Mercury': '☿', 'Venus': '♀',
    'Mars': '♂', 'Jupiter': '♃', 'Saturn': '♄', 'Uranus': '⛢',
    'Neptune': '♆', 'Pluto': '♇'
  };
  return symbols[planet] || '✨';
}