'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Boundary } from '@/components/ui/boundary';

interface User {
  id: string;
  email: string;
  username: string | null;
  role: string;
  created_at: string;
  credit_balance: number;
  reading_count: number;
  session_count: number;
}

function roleBadge(role: string) {
  const styles: Record<string, string> = {
    admin: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
    member: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
    user:   'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[role] ?? styles.user}`}>
      {role}
    </span>
  );
}

function initials(user: User) {
  return (user.username || user.email).slice(0, 2).toUpperCase();
}

// ── Edit panel ─────────────────────────────────────────────────────────────────

function EditPanel({
  user,
  onClose,
  onUpdated,
  onDeleted,
}: {
  user: User;
  onClose: () => void;
  onUpdated: (u: User) => void;
  onDeleted: (id: string) => void;
}) {
  const [email, setEmail]       = useState(user.email);
  const [username, setUsername] = useState(user.username ?? '');
  const [role, setRole]         = useState(user.role);
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState('');

  const [creditAmount, setCreditAmount]   = useState('');
  const [creditDesc, setCreditDesc]       = useState('');
  const [creditBalance, setCreditBalance] = useState(user.credit_balance);
  const [creditSaving, setCreditSaving]   = useState(false);
  const [creditError, setCreditError]     = useState('');
  const [creditSuccess, setCreditSuccess] = useState('');

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [deleteError, setDeleteError]     = useState('');

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, username: username || null, role }),
      });
      const data = await res.json();
      if (!res.ok) { setSaveError(data.error || 'Failed to save'); return; }
      onUpdated({ ...user, ...data.user, credit_balance: creditBalance });
    } catch {
      setSaveError('Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCredits = async () => {
    const amt = parseInt(creditAmount, 10);
    if (!amt) return;
    setCreditSaving(true);
    setCreditError('');
    setCreditSuccess('');
    try {
      const res = await fetch(`/api/admin/users/${user.id}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount: amt, description: creditDesc || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setCreditError(data.error || 'Failed'); return; }
      setCreditBalance(data.balance);
      setCreditAmount('');
      setCreditDesc('');
      setCreditSuccess(`Balance updated to ${data.balance} credits`);
      setTimeout(() => setCreditSuccess(''), 3000);
    } catch {
      setCreditError('Failed to adjust credits.');
    } finally {
      setCreditSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data.error || 'Failed to delete'); setDeleting(false); return; }
      onDeleted(user.id);
    } catch {
      setDeleteError('Failed to delete. Try again.');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-700 to-yellow-500 flex items-center justify-center text-white text-sm font-bold">
              {initials(user)}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user.username || user.email}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Credits', value: creditBalance },
              { label: 'Readings', value: user.reading_count },
              { label: 'Sessions', value: user.session_count },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Edit user info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">User Info</h3>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="user">user</option>
                <option value="member">member</option>
                <option value="admin">admin</option>
              </select>
            </div>
            {saveError && <p className="text-xs text-red-500">{saveError}</p>}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2 bg-yellow-700 hover:bg-yellow-800 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Credits */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Adjust Credits</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Use positive numbers to add, negative to deduct.</p>
            <div className="flex gap-2">
              <input
                type="number"
                value={creditAmount}
                onChange={e => setCreditAmount(e.target.value)}
                placeholder="e.g. 100 or -50"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
              />
              <button
                onClick={handleCredits}
                disabled={creditSaving || !creditAmount}
                className="px-4 py-2 bg-yellow-700 hover:bg-yellow-800 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {creditSaving ? '...' : 'Apply'}
              </button>
            </div>
            <input
              type="text"
              value={creditDesc}
              onChange={e => setCreditDesc(e.target.value)}
              placeholder="Note / reason (optional)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
            />
            {creditError   && <p className="text-xs text-red-500">{creditError}</p>}
            {creditSuccess && <p className="text-xs text-green-600 dark:text-green-400">{creditSuccess}</p>}
          </div>

          {/* Danger zone */}
          <div className="border border-red-200 dark:border-red-900 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">Danger Zone</h3>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Delete User
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-red-600 dark:text-red-400">This will permanently delete the user and all their data. Are you sure?</p>
                {deleteError && <p className="text-xs text-red-500">{deleteError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {deleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<User | null>(null);

  const load = useCallback(async (q = '') => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch(`/api/admin/users${q ? `?search=${encodeURIComponent(q)}` : ''}`, { credentials: 'include' });
      const data = await res.json();
      if (res.status === 403) { router.push('/'); return; }
      if (!res.ok) { setLoadError(data.error || `Error ${res.status}`); return; }
      setUsers(data.users || []);
    } catch (e: any) {
      setLoadError(e?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const handleUpdated = (updated: User) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
    setSelected(prev => prev?.id === updated.id ? { ...prev, ...updated } : prev);
  };

  const handleDeleted = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    setSelected(null);
  };

  return (
    <Boundary label="User Management" animateRerendering={false}>
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {users.length} users
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by email or username..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-yellow-600" />
          </div>
        ) : loadError ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
            {loadError}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No users found.</div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Role</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Credits</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden sm:table-cell">Readings</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden sm:table-cell">Sessions</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Joined</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {users.map(user => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors cursor-pointer"
                    onClick={() => setSelected(user)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-700 to-yellow-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {initials(user)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {user.username || <span className="text-gray-400 italic">no username</span>}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{roleBadge(user.role)}</td>
                    <td className="px-4 py-3 text-right font-medium text-yellow-700 dark:text-yellow-500">{user.credit_balance}</td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 hidden sm:table-cell">{user.reading_count}</td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 hidden sm:table-cell">{user.session_count}</td>
                    <td className="px-4 py-3 text-right text-gray-400 text-xs hidden md:table-cell">
                      {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <svg className="w-4 h-4 text-gray-400 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <EditPanel
          user={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </Boundary>
  );
}
