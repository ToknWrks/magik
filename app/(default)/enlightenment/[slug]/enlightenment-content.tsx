// app/(default)/enlightenment/[slug]/enlightenment-content.tsx
'use client';

import { useEffect, useState } from 'react';
import { Boundary } from '@/components/ui/boundary';
import Link from 'next/link';
import ShareToX from '@/components/ShareToX';
import AutoLinkMarkdown from '@/components/AutoLinkMarkdown';
import AudioPlayer from '@/components/AudioPlayer';

interface EnlightenmentContentProps {
  slug: string;
}

// Extract a teaser from markdown body — first ~3 paragraphs
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
          The full teaching is available to members. Sign in or create an account to continue reading.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Link
            href={`/signin?redirect=/enlightenment/${slug}`}
            className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-sm text-center transition-colors"
          >
            Sign In
          </Link>
          <Link
            href={`/signup?redirect=/enlightenment/${slug}`}
            className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium rounded-lg text-sm text-center transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export function EnlightenmentContent({ slug }: EnlightenmentContentProps) {
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

        {/* Audio player — shown to logged-in members when audio exists */}
        {isLoggedIn && content.audio_url && (
          <div className="mb-6">
            <AudioPlayer url={content.audio_url} label={`Listen: ${content.title}`} />
          </div>
        )}

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

        {/* Main Content with Auto-Links */}
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

        {/* Spiritual Practices */}
        {isLoggedIn && content.spiritual_practices?.length > 0 && (
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
        {isLoggedIn && content.sources?.length > 0 && (
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

        {/* Discuss with Solomon */}
        {isLoggedIn && (
          <div className="mt-10 p-5 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-200 dark:border-yellow-800 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
              <img src="/images/illuminati-logo.png" alt="Solomon" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Discuss this teaching with Solomon</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Your personal spiritual guide — ask questions, explore deeper, reflect on what resonated.</p>
            </div>
            <button
              onClick={() => {
                try {
                  sessionStorage.setItem('solomon_content_context', JSON.stringify({ title: content.title, type: 'enlightenment' }));
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