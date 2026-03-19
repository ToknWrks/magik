'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Boundary } from '@/components/ui/boundary';
import Link from 'next/link';

interface Session {
  id: string;
  summary: string | null;
  duration_seconds: number;
  credits_used: number;
  created_at: string;
}

function fmtDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

export default function CoachingSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (!d.user) { router.push('/signin?redirect=/coaching/sessions'); return; }
        return fetch('/api/coaching/sessions', { credentials: 'include' }).then(r => r.json());
      })
      .then(d => d && setSessions(d.sessions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <Boundary label="My Sessions">
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-yellow-600" />
        </div>
      </Boundary>
    );
  }

  return (
    <Boundary label="My Sessions" animateRerendering={false}>
      <div className="max-w-2xl mx-auto space-y-5">

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Sessions</h1>
          <Link
            href="/coaching"
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-700 hover:bg-yellow-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Session
          </Link>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-10 text-center">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No sessions yet.</p>
            <Link
              href="/coaching"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-700 hover:bg-yellow-800 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Begin your first session
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => (
              <div
                key={session.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Header row */}
                <button
                  onClick={() => setExpanded(expanded === session.id ? null : session.id)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-800 to-yellow-600 flex items-center justify-center text-sm flex-shrink-0">
                      ⚕
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Session with Solomon
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{fmtDate(session.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{fmtDuration(session.duration_seconds)}</p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-500">{session.credits_used} credits</p>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${expanded === session.id ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded summary */}
                {expanded === session.id && (
                  <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex gap-4 text-sm py-3 sm:hidden">
                      <span className="text-gray-500 dark:text-gray-400">{fmtDuration(session.duration_seconds)}</span>
                      <span className="text-yellow-700 dark:text-yellow-500">{session.credits_used} credits</span>
                    </div>
                    {session.summary ? (
                      <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                        {session.summary}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-gray-400 italic">No reflection saved for this session.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </Boundary>
  );
}
