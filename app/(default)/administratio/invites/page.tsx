'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Boundary } from '@/components/ui/boundary';

interface InviteCode {
  id: string;
  code: string;
  description: string | null;
  type: string;
  max_uses: number;
  uses: number;
  credits: number;
  expires_at: string | null;
  created_at: string;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function InvitesPage() {
  const router = useRouter();
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newCode, setNewCode]         = useState('');
  const [newDesc, setNewDesc]         = useState('');
  const [newMaxUses, setNewMaxUses]   = useState('1');
  const [newCredits, setNewCredits]   = useState('100');
  const [newExpiry, setNewExpiry]     = useState('');
  const [creating, setCreating]       = useState(false);
  const [createError, setCreateError] = useState('');

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting]           = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/invite/create', { credentials: 'include' });
      const data = await res.json();
      if (res.status === 403) { router.push('/'); return; }
      if (!res.ok) { setError(data.error || `Error ${res.status}`); return; }
      setCodes(data.codes || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load codes');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      const res = await fetch('/api/invite/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: newCode.trim(),
          description: newDesc.trim() || undefined,
          maxUses: parseInt(newMaxUses) || 1,
          credits: parseInt(newCredits) || 0,
          expiresAt: newExpiry || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error || 'Failed to create'); return; }
      setNewCode('');
      setNewDesc('');
      setNewMaxUses('1');
      setNewCredits('100');
      setNewExpiry('');
      await load();
    } catch {
      setCreateError('Failed to create code.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`/api/invite/create/${id}`, { method: 'DELETE', credentials: 'include' });
      setCodes(prev => prev.filter(c => c.id !== id));
      setConfirmDelete(null);
    } catch {
      // leave unchanged
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Boundary label="Invite Codes" animateRerendering={false}>
      <div className="max-w-3xl mx-auto space-y-8">

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Invite Codes</h1>
          <span className="text-sm text-gray-400">{codes.length} code{codes.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Create form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Create New Code</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Code <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newCode}
                  onChange={e => setNewCode(e.target.value.toUpperCase())}
                  placeholder="e.g. WELCOME2025"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm font-mono uppercase tracking-wider"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Max Uses</label>
                <input
                  type="number"
                  min="1"
                  value={newMaxUses}
                  onChange={e => setNewMaxUses(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tokens Granted</label>
                <input
                  type="number"
                  min="0"
                  value={newCredits}
                  onChange={e => setNewCredits(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="e.g. Beta invite for friends"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Expires (optional)</label>
                <input
                  type="date"
                  value={newExpiry}
                  onChange={e => setNewExpiry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>
            </div>
            {createError && <p className="text-xs text-red-500">{createError}</p>}
            <button
              type="submit"
              disabled={creating || !newCode.trim()}
              className="px-5 py-2 bg-yellow-700 hover:bg-yellow-800 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {creating ? 'Creating...' : 'Create Code'}
            </button>
          </form>
        </div>

        {/* Code list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-yellow-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">{error}</div>
        ) : codes.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No invite codes yet.</div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden sm:table-cell">Description</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Uses</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden sm:table-cell">Tokens</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Expires</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {codes.map(code => {
                  const exhausted = code.uses >= code.max_uses;
                  const expired = code.expires_at && new Date(code.expires_at) < new Date();
                  const active = !exhausted && !expired;
                  return (
                    <tr key={code.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-gray-900 dark:text-gray-100 tracking-wider">{code.code}</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                            active
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                          }`}>
                            {exhausted ? 'used up' : expired ? 'expired' : 'active'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{code.description || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium ${exhausted ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                          {code.uses}/{code.max_uses}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 text-sm hidden sm:table-cell">
                        {code.credits > 0 ? <span className="text-yellow-600 dark:text-yellow-500 font-medium">{code.credits}</span> : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                        {code.expires_at ? fmtDate(code.expires_at) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{fmtDate(code.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        {confirmDelete === code.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleDelete(code.id)}
                              disabled={deleting === code.id}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                              {deleting === code.id ? '...' : 'Delete'}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-2.5 py-1 text-gray-500 text-xs hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(code.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete code"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Boundary>
  );
}
