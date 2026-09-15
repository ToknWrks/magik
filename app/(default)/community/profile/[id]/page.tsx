'use client';

// app/(default)/community/profile/[id]/page.tsx
// Public member profile — fetched client-side from /api/community/users/[id].
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MemberAvatar, CommunityUser } from '../../member-card';

interface MemberProfile extends CommunityUser {
  sigil_count: number;
  reading_count: number;
  session_count: number;
}

export default function MemberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/community/users/${id}`, { credentials: 'include' })
      .then(async r => {
        if (r.status === 401) {
          router.push('/signin');
          return null;
        }
        if (!r.ok) {
          setError('Member not found.');
          return null;
        }
        return r.json();
      })
      .then(data => {
        if (data?.user) setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load member profile.');
        setLoading(false);
      });
  }, [id, router]);

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    } catch {
      return '';
    }
  };

  const shortWallet = user?.wallet_address
    ? `${user.wallet_address.slice(0, 6)}…${user.wallet_address.slice(-4)}`
    : null;

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-8 animate-pulse">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="space-y-2">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">{error || 'Member not found.'}</div>
      </div>
    );
  }

  const stats = [
    { label: 'Sigils', value: user.sigil_count },
    { label: 'Readings', value: user.reading_count },
    { label: 'Coaching Sessions', value: user.session_count },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-5xl mx-auto">

      <button
        onClick={() => router.push('/community/users-tabs')}
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-6 flex items-center gap-1"
      >
        <svg className="fill-current shrink-0 mr-1" width="16" height="16" viewBox="0 0 16 16">
          <path d="M9.4 13.4l1.4-1.4-4-4 4-4-1.4-1.4L4 8z" />
        </svg>
        Back to members
      </button>

      {/* Profile card */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <MemberAvatar user={user} size={96} />
          <div className="grow">
            <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">{user.username}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span>Joined {formatDate(user.created_at)}</span>
              {shortWallet && (
                <span className="flex items-center gap-1 font-mono text-xs">
                  <span>⛓</span>{shortWallet}
                </span>
              )}
              {user.role === 'admin' && (
                <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/40 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-300">
                  Admin
                </span>
              )}
            </div>
            {user.bio?.trim() ? (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-4 whitespace-pre-line">{user.bio}</p>
            ) : (
              <p className="text-sm italic text-gray-400 dark:text-gray-500 mt-4">This seeker hasn&rsquo;t written a bio yet.</p>
            )}
          </div>
        </div>

        {/* Public activity stats */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          {stats.map(s => (
            <div key={s.label} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{s.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
