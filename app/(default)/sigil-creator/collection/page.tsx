'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Boundary } from '@/components/ui/boundary';

interface SavedSigil {
  id: string;
  intention: string;
  consonants: string;
  base_form: string;
  blob_url: string;
  created_at: string;
}

export default function SigilCollectionPage() {
  const router = useRouter();
  const [sigils, setSigils] = useState<SavedSigil[] | null>(null); // null = loading
  const [confirmRelease, setConfirmRelease] = useState<SavedSigil | null>(null);
  const [releasing, setReleasing] = useState(false);
  const [error, setError] = useState('');

  const loadSigils = useCallback(() => {
    fetch('/api/sigil/list?limit=100', { credentials: 'include' })
      .then(r => {
        if (r.status === 401) { router.push('/signin?redirect=/sigil-creator/collection'); return null; }
        return r.json();
      })
      .then(d => { if (d) setSigils(d.sigils || []); })
      .catch(() => setSigils([]));
  }, [router]);

  useEffect(() => { loadSigils(); }, [loadSigils]);

  const release = async () => {
    if (!confirmRelease) return;
    setError('');
    try {
      const res = await fetch(`/api/sigil/list?id=${confirmRelease.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to release');
      setSigils(prev => (prev || []).filter(s => s.id !== confirmRelease.id));
      setConfirmRelease(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to release sigil');
      setConfirmRelease(null);
    }
  };

  return (
    <Boundary label="My Sigils">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Sigils</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {sigils && sigils.length > 0
                ? `${sigils.length} sigil${sigils.length === 1 ? '' : 's'} kept`
                : 'Sigils you save from the creator live here.'}
            </p>
          </div>
          <button
            onClick={() => { window.location.href = '/sigil-creator'; }}
            className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-white transition-colors"
          >
            ✦ New Sigil
          </button>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {/* Loading */}
        {sigils === null && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto" />
            <p className="text-gray-500 dark:text-gray-400 mt-3 text-sm">Loading...</p>
          </div>
        )}

        {/* Empty state */}
        {sigils !== null && sigils.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center">
            <span className="astrology-symbol text-4xl text-gray-300 dark:text-gray-600">{"\u26E4"}</span>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-4 mb-2">No sigils yet</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">
              Speak an intention, receive a sigil, and save the ones that resonate.
            </p>
            <button
              onClick={() => { window.location.href = '/sigil-creator'; }}
              className="px-6 py-2.5 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-white transition-colors"
            >
              Create your first sigil ✦
            </button>
          </div>
        )}

        {/* Gallery */}
        {sigils !== null && sigils.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {sigils.map(sigil => (
              <div key={sigil.id} className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <a href={sigil.blob_url} target="_blank" rel="noopener noreferrer" className="block aspect-square bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sigil.blob_url}
                    alt={sigil.intention}
                    className="w-full h-full object-contain transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </a>
                <div className="p-3">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-1" title={sigil.intention}>
                    {sigil.intention}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                    {new Date(sigil.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <button
                    onClick={() => setConfirmRelease(sigil)}
                    className="mt-2 w-full text-[11px] py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-500 hover:border-red-300 dark:hover:border-red-800 transition-colors"
                  >
                    Let it go
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Release confirmation */}
        {confirmRelease && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setConfirmRelease(null); }}>
            <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-sm p-6 text-center border border-gray-200 dark:border-gray-700">
              <span className="astrology-symbol text-3xl text-gray-400">{"\u26E4"}</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-3 mb-2">Release this sigil?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 italic line-clamp-2">"{confirmRelease.intention}"</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
                It will be unmade — image and record, gone forever. There is no undo.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmRelease(null)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Keep it
                </button>
                <button
                  onClick={release}
                  className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
                >
                  Let it go ✦
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Boundary>
  );
}
