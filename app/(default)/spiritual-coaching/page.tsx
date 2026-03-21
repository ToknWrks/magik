'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Boundary } from '@/components/ui/boundary';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/hooks/useLanguage';
import LanguageSelector from '@/components/LanguageSelector';

const SolomonSession = dynamic(() => import('./SolomonSession'), { ssr: false });

function CoachingPageInner() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { language, setLanguage } = useLanguage();
  // Read sessionStorage synchronously at first render so props are correct before SolomonSession mounts
  const [initialResumeChatGroupId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const id = sessionStorage.getItem('solomon_resume_chat_group_id');
      if (id) { sessionStorage.removeItem('solomon_resume_chat_group_id'); return id; }
    } catch {}
    return null;
  });
  const [initialResumeElapsed] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const v = sessionStorage.getItem('solomon_resume_elapsed');
      if (v) { sessionStorage.removeItem('solomon_resume_elapsed'); return parseInt(v, 10); }
    } catch {}
    return 0;
  });
  const [initialResumeTranscript] = useState<any[] | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const v = sessionStorage.getItem('solomon_resume_transcript');
      if (v) { sessionStorage.removeItem('solomon_resume_transcript'); return JSON.parse(v); }
    } catch {}
    return null;
  });
  const [initialContentContext] = useState<{ title: string; type: 'enlightenment' | 'mystery' } | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const v = sessionStorage.getItem('solomon_content_context');
      if (v) { sessionStorage.removeItem('solomon_content_context'); return JSON.parse(v); }
    } catch {}
    return null;
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/hume/token').then(r => r.json()),
      fetch('/api/credits/balance', { credentials: 'include' }).then(r => r.json()),
    ]).then(([auth, tokenData, creditsData]) => {
      if (!auth.user) {
        router.push('/signin?redirect=/spiritual-coaching');
        return;
      }
      if (tokenData.error) {
        setError('Failed to connect to Solomon. Please try again.');
        return;
      }
      setAccessToken(tokenData.accessToken);
      setBalance(creditsData.balance ?? 0);
    }).catch(() => {
      setError('Something went wrong. Please refresh.');
    }).finally(() => {
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <Boundary label="Coaching">
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Preparing your session...</p>
        </div>
      </Boundary>
    );
  }

  if (error) {
    return (
      <Boundary label="Coaching">
        <div className="text-center py-24">
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-yellow-700 hover:bg-yellow-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </Boundary>
    );
  }

  if (!accessToken || balance === null) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img src="/images/illuminati-logo.png" alt="Solomon" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Solomon</p>
            <p className="text-xs text-gray-400">Authentic Intelligence Spiritual Coach</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector value={language} onChange={setLanguage} />
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <svg className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
            </svg>
            <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-500">{balance} tokens</span>
          </div>
        </div>
      </div>

      {/* Session */}
      <SolomonSession
        accessToken={accessToken}
        initialBalance={balance}
        initialResumeTranscript={initialResumeTranscript}
        initialResumeChatGroupId={initialResumeChatGroupId}
        initialResumeElapsed={initialResumeElapsed}
        initialContentContext={initialContentContext}
        language={language}
      />
    </div>
  );
}

export default function CoachingPage() {
  return (
    <Suspense>
      <CoachingPageInner />
    </Suspense>
  );
}
