'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Boundary } from '@/components/ui/boundary';
import SigilModal from '@/components/sigil/SigilModal';

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

  // Working modal state
  const [working, setWorking] = useState<SavedSigil | null>(null);
  const [savedInSession, setSavedInSession] = useState(false);

  // Auth + balance (needed for modal actions)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  const loadSigils = useCallback(() => {
    fetch('/api/sigil/list?limit=100', { credentials: 'include' })
      .then(r => {
        if (r.status === 401) { router.push('/signin?redirect=/sigil-creator/collection'); return null; }
        return r.json();
      })
      .then(d => { if (d) setSigils(d.sigils || []); })
      .catch(() => setSigils([]));
  }, [router]);

  useEffect(() => {
    loadSigils();
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setIsLoggedIn(!!d.user))
      .catch(() => {});
    fetch('/api/credits/balance', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setBalance(d.balance))
      .catch(() => {});
  }, [loadSigils]);

  const release = async (sigil: SavedSigil) => {
    setError('');
    try {
      const res = await fetch(`/api/sigil/list?id=${sigil.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to release');
      setSigils(prev => (prev || []).filter(s => s.id !== sigil.id));
      setConfirmRelease(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to release sigil');
      setConfirmRelease(null);
    }
  };

  // Refine the working sigil in place (server evolves the image)
  const handleRefine = useCallback(async () => {
    if (!working) return;
    setError('');
    try {
      const res = await fetch('/api/credits/spend', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 10, description: 'Sigil Collection — Refine' }),
      });
      const spendData = await res.json();
      if (!res.ok || !spendData.success) throw new Error(spendData.error || 'Failed to spend tokens');
      setBalance(spendData.balance);

      const genRes = await fetch('/api/sigil/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consonants: working.consonants, intention: working.intention, refine: true }),
      });
      const genData = await genRes.json();
      if (!genRes.ok || !genData.url) throw new Error(genData.error || 'Generation failed');

      // Swap in the new image (still the same saved record until re-saved)
      setWorking({ ...working, blob_url: genData.url });
      // A refined collection sigil differs from its saved version — allow re-save
      setSavedInSession(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Refine failed');
    }
  }, [working]);

  // Save a refined sigil (updates the collection without adding a row)
  const handleSaveRefined = useCallback(async () => {
    if (!working) return;
    setError('');
    try {
      const res = await fetch('/api/sigil/save', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: working.blob_url,
          intention: working.intention,
          consonants: working.consonants,
          baseForm: working.base_form,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save');
      // Replace the sigil in the grid with the new version, keep modal open
      setSigils(prev => (prev || []).map(s => s.id === working.id ? { ...working, blob_url: data.sigil.blob_url } : s));
      setWorking({ ...working, blob_url: data.sigil.blob_url });
      setSavedInSession(true);
      // Refresh balance (save is free but refine spent earlier)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save sigil');
    }
  }, [working]);

  // Release from inside the working modal: delete server-side, close, update grid
  const handleModalReleased = useCallback(() => {
    if (!working) return;
    const target = sigils?.find(s => s.blob_url === working.blob_url) || null;
    setWorking(null);
    setSavedInSession(false);
    if (target) {
      release(target);
    }
  }, [working, sigils]);

  if (sigils === null) {
    return (
      <Boundary label="My Sigils">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto" />
          <p className="text-gray-500 dark:text-gray-400 mt-3 text-sm">Loading...</p>
        </div>
      </Boundary>
    );
  }

  return (
    <Boundary label="My Sigils">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Sigils</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {sigils.length > 0
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

        {/* Empty state */}
        {sigils.length === 0 && (
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
        {sigils.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {sigils.map(sigil => (
              <div key={sigil.id} className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  onClick={() => { setWorking(sigil); setSavedInSession(true); setError(''); }}
                  className="block w-full aspect-square bg-black"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sigil.blob_url}
                    alt={sigil.intention}
                    className="w-full h-full object-contain transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </button>
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

        {/* Working modal — same as the creator's */}
        {working && (
          <SigilModal
            open={!!working}
            onClose={() => { setWorking(null); setSavedInSession(false); }}
            sigilUrl={working.blob_url}
            intention={working.intention}
            uniqueConsonants={working.consonants}
            alreadySaved={savedInSession}
            balance={balance}
            isLoggedIn={isLoggedIn}
            onRefine={handleRefine}
            onNeedLogin={() => { if (!isLoggedIn) router.push('/signin?redirect=/sigil-creator/collection'); }}
            onReleased={handleModalReleased}
          />
        )}

        {/* Release confirmation (from grid) */}
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
                  onClick={async () => { const target = confirmRelease; setConfirmRelease(null); await release(target); }}
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
