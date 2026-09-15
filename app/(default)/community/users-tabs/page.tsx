'use client';

// app/(default)/community/users-tabs/page.tsx
// Member directory — real user accounts from /api/community/users.
// Same visual layout as the original Mosaic Users Tabs page (3-col cards).
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import MemberCard, { MemberAvatar, CommunityUser } from '../member-card';

const PAGE_SIZE = 24;

export default function UsersTabs() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [users, setUsers] = useState<CommunityUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (!data.user) {
          router.push('/signin');
        } else {
          setAuthed(true);
        }
      })
      .catch(() => router.push('/signin'));
  }, [router]);

  const load = useCallback(async (search: string, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (search) params.set('q', search);
      const res = await fetch(`/api/community/users?${params}`, { credentials: 'include' });
      if (res.status === 401) {
        router.push('/signin');
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(data.page || 1);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (authed) load('', 1);
  }, [authed, load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchRef.current?.value.trim() || '';
    setQ(term);
    load(term, 1);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">

      {/* Page header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">

        {/* Left: Title */}
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Community Members</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {loading ? 'Loading…' : `${total} member${total === 1 ? '' : 's'}`}
          </p>
        </div>

        {/* Right: Search */}
        <form onSubmit={handleSearch} className="relative w-full sm:w-72">
          <label htmlFor="member-search" className="sr-only">Search members</label>
          <input
            id="member-search"
            ref={searchRef}
            className="form-input pl-9 bg-white dark:bg-gray-800 w-full"
            type="search"
            placeholder="Search by name or wallet…"
          />
          <button className="absolute inset-0 right-auto group" type="submit" aria-label="Search">
            <svg className="shrink-0 fill-current text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400 ml-3 mr-2" width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zM7 2C4.243 2 2 4.243 2 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5z" />
              <path d="M15.707 14.293L13.314 11.9a8.019 8.019 0 01-1.414 1.414l2.393 2.393a.997.997 0 001.414 0 .999.999 0 000-1.414z" />
            </svg>
          </button>
        </form>

      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-12 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="col-span-full sm:col-span-6 xl:col-span-3 bg-white dark:bg-gray-800 shadow-sm rounded-xl p-5 animate-pulse">
              <div className="flex justify-center mb-2">
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto mb-3" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mx-auto" />
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {q ? 'No members match your search.' : 'No members yet.'}
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {users.map(user => (
            <MemberCard
              key={user.id}
              user={user} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center gap-2" role="navigation" aria-label="Pagination">
            <button
              disabled={page <= 1}
              onClick={() => load(q, page - 1)}
              className="inline-flex items-center justify-center rounded-lg leading-5 px-2.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <span className="sr-only">Previous</span>
              <svg className="fill-current" width="16" height="16" viewBox="0 0 16 16">
                <path d="M9.4 13.4l1.4-1.4-4-4 4-4-1.4-1.4L4 8z" />
              </svg>
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-300 px-2">
              Page {page} of {pages}
            </span>
            <button
              disabled={page >= pages}
              onClick={() => load(q, page + 1)}
              className="inline-flex items-center justify-center rounded-lg leading-5 px-2.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <span className="sr-only">Next</span>
              <svg className="fill-current" width="16" height="16" viewBox="0 0 16 16">
                <path d="M6.6 2.6L5.2 4l4 4-4 4 1.4 1.4L11.6 8z" />
              </svg>
            </button>
          </nav>
        </div>
      )}

    </div>
  )
}
