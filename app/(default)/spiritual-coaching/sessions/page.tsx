'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Boundary } from '@/components/ui/boundary';
import Link from 'next/link';
import { formatCo2 } from '@/lib/regen-footprint';

interface Session {
  id: string;
  summary: string | null;
  duration_seconds: number;
  credits_used: number;
  hume_chat_group_id?: string | null;
  co2_grams: string | null;
  regen_contribution_cents: number | null;
  created_at: string;
}

interface SessionDetail extends Session {
  transcript: any[] | null;
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

function Transcript({ messages }: { messages: any[] }) {
  const filtered = messages.filter(
    (m: any) => m.type === 'user_message' || m.type === 'assistant_message'
  );
  if (filtered.length === 0) return <p className="text-sm text-gray-400 italic">No transcript available.</p>;

  return (
    <div className="space-y-3">
      {filtered.map((msg: any, i: number) => {
        const isUser = msg.type === 'user_message';
        return (
          <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
              isUser
                ? 'bg-yellow-700 text-white rounded-br-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'
            }`}>
              {!isUser && (
                <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-500 mb-0.5 uppercase tracking-wide">Solomon</p>
              )}
              <p>{msg.message?.content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CoachingSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<Record<string, SessionDetail>>({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, 'reflection' | 'transcript'>>({});
  const [resuming, setResuming] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (!d.user) { router.push('/signin?redirect=/spiritual-coaching/sessions'); return; }
        return fetch('/api/coaching/sessions', { credentials: 'include' }).then(r => r.json());
      })
      .then(d => d && setSessions(d.sessions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const handleExpand = async (id: string) => {
    const next = expanded === id ? null : id;
    setExpanded(next);
    if (next && !sessionDetails[id]) {
      setLoadingDetail(id);
      try {
        const res = await fetch(`/api/coaching/sessions/${id}`, { credentials: 'include' });
        const data = await res.json();
        if (data.session) {
          setSessionDetails(prev => ({ ...prev, [id]: data.session }));
        }
      } catch {
        // detail unavailable
      } finally {
        setLoadingDetail(null);
      }
    }
  };

  const handleDelete = async (sessionId: string) => {
    setDeleting(sessionId);
    try {
      await fetch(`/api/coaching/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setConfirmDelete(null);
      if (expanded === sessionId) setExpanded(null);
    } catch {
      // leave UI unchanged on error
    } finally {
      setDeleting(null);
    }
  };

  const handleResume = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);

    // Native Hume resume: use chatGroupId if available (new sessions)
    if (session?.hume_chat_group_id) {
      try {
        sessionStorage.setItem('solomon_resume_chat_group_id', session.hume_chat_group_id);
        sessionStorage.setItem('solomon_resume_elapsed', String(session.duration_seconds ?? 0));
      } catch { /* ignore */ }
      router.push('/spiritual-coaching?resume=true');
      return;
    }

    // Legacy fallback: inject transcript for old sessions without chatGroupId
    setResuming(sessionId);
    try {
      let detail = sessionDetails[sessionId];
      if (!detail) {
        const res = await fetch(`/api/coaching/sessions/${sessionId}`, { credentials: 'include' });
        const data = await res.json();
        detail = data.session;
        if (detail) setSessionDetails(prev => ({ ...prev, [sessionId]: detail }));
      }
      if (detail?.transcript) {
        sessionStorage.setItem('solomon_resume_transcript', JSON.stringify(detail.transcript));
        sessionStorage.setItem('solomon_resume_session_id', sessionId);
        router.push('/spiritual-coaching?resume=true');
      }
    } catch {
      setResuming(null);
    }
  };

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
            href="/spiritual-coaching"
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-700 hover:bg-yellow-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Session
          </Link>
        </div>

        {/* Ecological impact banner */}
        {sessions.length > 0 && sessions.some(s => s.co2_grams) && (() => {
          const totalCo2 = sessions.reduce((sum, s) => sum + (s.co2_grams ? parseFloat(s.co2_grams) : 0), 0);
          const totalContrib = sessions.reduce((sum, s) => sum + (s.regen_contribution_cents ?? 0), 0);
          return (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-green-600 dark:text-green-400 text-lg">🌿</span>
              <div className="text-sm text-green-800 dark:text-green-300">
                <span className="font-semibold">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
                {' · '}~{formatCo2(totalCo2)} CO₂ generated
                {' · '}
                <span className="font-semibold">${(totalContrib / 100).toFixed(2)}</span> contributed to ecological regeneration
              </div>
            </div>
          );
        })()}

        {sessions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-10 text-center">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No sessions yet.</p>
            <Link
              href="/spiritual-coaching"
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
                <div className="w-full px-5 py-4 flex items-center justify-between">
                  <button
                    onClick={() => handleExpand(session.id)}
                    className="flex items-center gap-4 flex-1 text-left hover:opacity-80 transition-opacity"
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                      <img src="/images/illuminati-logo.png" alt="Solomon" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Session with Solomon
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{fmtDate(session.created_at)}</p>
                    </div>
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{fmtDuration(session.duration_seconds)}</p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-500">{session.credits_used} credits</p>
                    </div>

                    {/* Resume button */}
                    <button
                      onClick={() => handleResume(session.id)}
                      disabled={resuming === session.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-700 hover:bg-yellow-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors flex-shrink-0"
                      title="Resume this session"
                    >
                      {resuming === session.id ? (
                        <div className="w-3 h-3 border-b border-white rounded-full animate-spin" />
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      Resume
                    </button>

                    {/* Delete button */}
                    {confirmDelete === session.id ? (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleDelete(session.id)}
                          disabled={deleting === session.id}
                          className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          {deleting === session.id ? '...' : 'Delete'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-2.5 py-1.5 text-gray-500 dark:text-gray-400 text-xs font-medium hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(session.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                        title="Delete session"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}

                    {/* Expand chevron */}
                    <button onClick={() => handleExpand(session.id)}>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${expanded === session.id ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {expanded === session.id && (
                  <div className="border-t border-gray-100 dark:border-gray-700">
                    {/* Mobile stats */}
                    <div className="flex gap-4 text-sm px-5 py-3 sm:hidden border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">{fmtDuration(session.duration_seconds)}</span>
                      <span className="text-yellow-700 dark:text-yellow-500">{session.credits_used} credits</span>
                    </div>

                    {/* Eco footprint */}
                    {session.co2_grams && (
                      <div className="px-5 py-2 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="text-green-500">🌿</span>
                        ~{formatCo2(parseFloat(session.co2_grams))} CO₂ used
                        {session.regen_contribution_cents && (
                          <span className="text-green-600 dark:text-green-500">
                            · ${(session.regen_contribution_cents / 100).toFixed(2)} contributed to Regen Network
                          </span>
                        )}
                      </div>
                    )}

                    {loadingDetail === session.id ? (
                      <div className="flex items-center gap-3 px-5 py-6 text-gray-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600" />
                        <span className="text-sm">Loading session...</span>
                      </div>
                    ) : (
                      <>
                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 dark:border-gray-700 px-5">
                          {(['reflection', 'transcript'] as const).map(tab => (
                            <button
                              key={tab}
                              onClick={() => setActiveTab(prev => ({ ...prev, [session.id]: tab }))}
                              className={`py-3 pr-5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                                (activeTab[session.id] ?? 'reflection') === tab
                                  ? 'border-yellow-600 text-yellow-700 dark:text-yellow-500'
                                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                              }`}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>

                        <div className="px-5 py-4">
                          {(activeTab[session.id] ?? 'reflection') === 'reflection' ? (
                            session.summary ? (
                              <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                {session.summary}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400 italic">No reflection saved for this session.</p>
                            )
                          ) : (
                            sessionDetails[session.id]?.transcript ? (
                              <Transcript messages={sessionDetails[session.id].transcript!} />
                            ) : (
                              <p className="text-sm text-gray-400 italic">Transcript not available.</p>
                            )
                          )}
                        </div>
                      </>
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
