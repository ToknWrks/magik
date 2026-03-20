// app/astrology/[slug]/astrology-content.tsx
'use client';

import { useEffect, useState } from 'react';
import { Boundary } from '@/components/ui/boundary';
import Link from 'next/link';
import ShareToX from '@/components/ShareToX';
import AutoLinkMarkdown from '@/components/AutoLinkMarkdown';
import Script from 'next/script';

interface AstrologyContentProps {
  slug: string;
}

function extractTeaser(body: string): string {
  const paragraphs = body.split(/\n\n+/).filter(p => p.trim() && !p.startsWith('#'));
  return paragraphs.slice(0, 3).join('\n\n');
}

function MemberGate({ slug }: { slug: string }) {
  return (
    <div className="relative">
      <div className="pointer-events-none select-none">
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white dark:from-gray-950 to-transparent z-10" />
      </div>
      <div className="relative z-20 mt-4 flex flex-col items-center text-center py-10 px-6 bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-800 rounded-xl shadow-sm">
        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Members Only</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 max-w-sm">
          The full interpretation is available to members. Sign in or create an account to continue reading.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Link
            href={`/signin?redirect=/astrology/${slug}`}
            className="flex-1 py-2.5 px-4 bg-yellow-700 hover:bg-yellow-800 text-white font-medium rounded-lg text-sm text-center transition-colors"
          >
            Sign In
          </Link>
          <Link
            href={`/signup?redirect=/astrology/${slug}`}
            className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium rounded-lg text-sm text-center transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AstrologyContent({ slug }: AstrologyContentProps) {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => setIsLoggedIn(!!d.user))
      .catch(() => setIsLoggedIn(false));
    generateContent();
  }, [slug]);

  const generateContent = async () => {
    try {
      setLoading(true);
      setError(null);

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
          created_at: template.created_at,
          updated_at: template.updated_at,
        });
        return;
      }

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

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: content.title,
    description: content.description || `Explore the ${content.title} planetary combination in archetypal astrology`,
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
      '@id': `https://illuminati.earth/astrology/${slug}`
    },
    articleSection: 'Astrology',
    keywords: [content.category, content.category2, 'archetypal astrology', 'planetary combinations'],
  };

  return (
    <>
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <Boundary label="Archetypal Astrology">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link href="/" className="hover:text-gray-700 dark:hover:text-gray-200">Home</Link></li>
              <li>/</li>
              <li><Link href="/astrology" className="hover:text-gray-700 dark:hover:text-gray-200">Astrology</Link></li>
              <li>/</li>
              <li className="text-gray-900 dark:text-gray-100 font-medium" aria-current="page">{content.title}</li>
            </ol>
          </nav>

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

          {/* Archetypal Themes — visible to all */}
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

          {/* Main Content — gated */}
          <article className="prose-article">
            {isLoggedIn ? (
              <AutoLinkMarkdown content={content.body || ''} currentSlug={slug} />
            ) : (
              <>
                <AutoLinkMarkdown content={extractTeaser(content.body || '')} currentSlug={slug} />
                <MemberGate slug={slug} />
              </>
            )}
          </article>

          {/* Evidence Points — members only */}
          {isLoggedIn && content.evidence_points?.length > 0 && (
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

          {/* Counterarguments — members only */}
          {isLoggedIn && content.counterarguments?.length > 0 && (
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
          {isLoggedIn && (
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
          )}
        </div>
      </Boundary>
    </>
  );
}

function getPlanetSymbol(planet: string): string {
  const symbols: Record<string, string> = {
    'Sun': '☉', 'Moon': '☽', 'Mercury': '☿', 'Venus': '♀',
    'Mars': '♂', 'Jupiter': '♃', 'Saturn': '♄', 'Uranus': '⛢',
    'Neptune': '♆', 'Pluto': '♇'
  };
  return symbols[planet] || '✨';
}
