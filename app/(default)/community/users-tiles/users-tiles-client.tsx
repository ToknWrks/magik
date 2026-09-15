'use client';

// app/(default)/community/users-tiles/users-tiles-client.tsx
// Admin-only tiles view of ALL users with emails, credit balances and
// activity counts — same visual layout as the original Mosaic Users Tiles.
import { useCallback, useEffect, useRef, useState } from 'react';

interface AdminUser {
  id: string;
  email: string;
  username: string | null;
  role: string;
  created_at: string;
  credit_balance: number;
  reading_count: number;
  session_count: number;
}

export default function UsersTilesClient() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/users?${params}`, { credentials: 'include' });
      if (res.status === 401 || res.status === 403) {
        setError('Admin access required.');
        setUsers([]);
      } else {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      setError('Failed to load users.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load('');
  }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(searchRef.current?.value.trim() || '');
  };

  const displayName = (u: AdminUser) =>
    u.username?.trim() || u.email.split('@')[0] || 'Unknown';

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">

      {/* Page header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">

        {/* Left: Title */}
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">All Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {loading ? 'Loading…' : `${users.length} account${users.length === 1 ? '' : 's'} (admin view)`}
          </p>
        </div>

        {/* Right: Search */}
        <form onSubmit={handleSearch} className="relative w-full sm:w-72">
          <label htmlFor="admin-user-search" className="sr-only">Search users</label>
          <input
            id="admin-user-search"
            ref={searchRef}
            className="form-input pl-9 bg-white dark:bg-gray-800 w-full"
            type="search"
            placeholder="Search email or username…"
          />
          <button className="absolute inset-0 right-auto group" type="submit" aria-label="Search">
            <svg className="shrink-0 fill-current text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400 ml-3 mr-2" width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zM7 2C4.243 2 2 4.243 2 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5z" />
              <path d="M15.707 14.293L13.314 11.9a8.019 8.019 0 01-1.414 1.414l2.393 2.393a.997.997 0 001.414 0 .999.999 0 000-1.414z" />
            </svg>
          </button>
        </form>

      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-12 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl p-5 animate-pulse">
              <div className="flex mb-2">
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 mr-5" />
                <div className="space-y-2 mt-1 grow">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mt-2" />
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No users found.
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {users.map(u => (
            <div key={u.id} className="col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
              <div className="flex flex-col h-full">
                <div className="grow p-5">
                  <div className="flex justify-between items-start">
                    <header>
                      <div className="flex mb-2">
                        <div className="relative inline-flex items-start mr-5">
                          {u.role === 'admin' && (
                            <div className="absolute top-0 right-0 -mr-2 bg-white dark:bg-gray-700 rounded-full shadow" aria-hidden="true">
                              <svg className="w-8 h-8 fill-current text-yellow-500" viewBox="0 0 32 32">
                                <path d="M21 14.077a.75.75 0 01-.75-.75 1.5 1.5 0 00-1.5-1.5.75.75 0 110-1.5 1.5 1.5 0 001.5-1.5.75.75 0 111.5 0 1.5 1.5 0 001.5 1.5.75.75 0 010 1.5 1.5 1.5 0 00-1.5 1.5.75.75 0 01-.75.75zM14 24.077a1 1 0 01-1-1 4 4 0 00-4-4 1 1 0 110-2 4 4 0 004-4 1 1 0 012 0 4 4 0 004 4 1 1 0 010 2 4 4 0 00-4 4 1 1 0 01-1 1z" />
                              </svg>
                            </div>
                          )}
                          <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                            <img src="/images/illuminati-logo.png" alt="" className="w-full h-full object-cover dark:hidden" />
                            <img src="/images/illuminati-logo-light.png" alt="" className="w-full h-full object-cover hidden dark:block" />
                          </div>
                        </div>
                        <div className="mt-1 pr-1">
                          <h2 className="text-xl leading-snug font-semibold text-gray-800 dark:text-gray-100">{displayName(u)}</h2>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[16rem]">{u.email}</div>
                        </div>
                      </div>
                    </header>
                    <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${u.role === 'admin'
                      ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
                      : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300'}`}>
                      {u.role}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <span><span className="font-semibold">{u.credit_balance}</span> credits</span>
                    <span><span className="font-semibold">{u.reading_count}</span> readings</span>
                    <span><span className="font-semibold">{u.session_count}</span> sessions</span>
                  </div>
                </div>
                <div className="border-t border-gray-100 dark:border-gray-700/60 px-5 py-3 text-xs text-gray-400 dark:text-gray-500">
                  Joined {new Date(u.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
