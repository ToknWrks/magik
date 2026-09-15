'use client';

// Discuss-with-Solomon entry page.
// Reached from teachings/mysteries "Talk to Solomon" buttons. Shows the content
// title and a suggested phrase the user can tell Solomon when the session opens,
// then hands off to /spiritual-coaching with the content context via sessionStorage
// (same mechanism the content pages already use).

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Boundary } from '@/components/ui/boundary';
import Link from 'next/link';

export default function DiscussPage({
  params,
}: {
  params: Promise<{ type: string; slug: string }>;
}) {
  const { type, slug } = use(params);
  const router = useRouter();
  const [title, setTitle] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const validType = type === 'enlightenment' || type === 'mystery';
  const basePath = type === 'enlightenment' ? '/enlightenment' : '/mysteries';

  useEffect(() => {
    if (!validType) { setChecking(false); return; }
    fetch(`/api/${type === 'enlightenment' ? 'enlightenment' : 'conspiracies'}/template/${slug}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d?.title) setTitle(d.title);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [type, slug, validType]);

  const begin = () => {
    try {
      sessionStorage.setItem('solomon_content_context', JSON.stringify({ title: title || slug, type }));
    } catch { /* ignore */ }
    router.push('/spiritual-coaching');
  };

  if (!validType) {
    return (
      <Boundary label="Discuss with Solomon">
        <div className="text-center py-24">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Unknown content type.</p>
          <Link href="/" className="text-sm underline">← Back</Link>
        </div>
      </Boundary>
    );
  }

  if (checking) {
    return (
      <Boundary label="Discuss with Solomon">
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Preparing your session...</p>
        </div>
      </Boundary>
    );
  }

  const displayTitle = title || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Boundary label="Discuss with Solomon">
      <div className="max-w-lg mx-auto py-12 px-4">
        {/* Solomon intro */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
            <img src="/images/illuminati-logo.png" alt="Solomon" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Solomon</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Authentic Intelligence Spiritual Coach</p>
          </div>
        </div>

        {/* Context */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">You've just been reading</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">&ldquo;{displayTitle}&rdquo;</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Solomon already knows the teaching you've been exploring and will open the conversation there. But if you'd like to steer him, say this when he greets you:
          </p>
        </div>

        {/* Suggested phrase */}
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/60 rounded-xl p-5 mb-6">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Say to Solomon</p>
          <p className="text-base font-medium text-gray-900 dark:text-gray-100 italic">
            &ldquo;I want to discuss {displayTitle}&rdquo;
          </p>
        </div>

        {/* Cost notice */}
        <p className="text-xs text-gray-400 text-center mb-6">
          Voice sessions have a 10-minute minimum (100 tokens), then 10 tokens per additional minute.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            href={`${basePath}/${slug}`}
            className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
          >
            ← Back to the teaching
          </Link>
          <button
            onClick={begin}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-yellow-700 hover:bg-yellow-800 text-white font-medium rounded-xl text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Begin Session
          </button>
        </div>
      </div>
    </Boundary>
  );
}
