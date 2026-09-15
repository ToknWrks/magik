'use client';

// app/(default)/community/member-card.tsx
// Member directory card used by the Users Tabs page — real account data.
import Link from 'next/link';

export interface CommunityUser {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  wallet_address: string | null;
  role: string;
  created_at: string;
}

export function MemberAvatar({ user, size = 64 }: { user: CommunityUser; size?: number }) {
  if (user.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatar_url}
        alt={user.username}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="rounded-full object-cover"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden"
    >
      <img
        src="/images/illuminati-logo.png"
        alt={user.username}
        className="w-full h-full object-cover dark:hidden"
      />
      <img
        src="/images/illuminati-logo-light.png"
        alt={user.username}
        className="w-full h-full object-cover hidden dark:block"
      />
    </div>
  );
}

function shortWallet(addr: string | null): string | null {
  if (!addr) return null;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function MemberCard({ user }: { user: CommunityUser }) {
  const wallet = shortWallet(user.wallet_address);

  return (
    <div className="col-span-full sm:col-span-6 xl:col-span-3 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <div className="flex flex-col h-full">
        <div className="grow p-5">
          <header>
            <div className="flex justify-center mb-2">
              <Link className="relative inline-flex items-start" href={`/community/profile/${user.id}`}>
                {user.role === 'admin' && (
                  <div className="absolute top-0 right-0 -mr-2 bg-white dark:bg-gray-700 rounded-full shadow" aria-hidden="true">
                    <svg className="w-8 h-8 fill-current text-yellow-500" viewBox="0 0 32 32">
                      <path d="M21 14.077a.75.75 0 01-.75-.75 1.5 1.5 0 00-1.5-1.5.75.75 0 110-1.5 1.5 1.5 0 001.5-1.5.75.75 0 111.5 0 1.5 1.5 0 001.5 1.5.75.75 0 010 1.5 1.5 1.5 0 00-1.5 1.5.75.75 0 01-.75.75zM14 24.077a1 1 0 01-1-1 4 4 0 00-4-4 1 1 0 110-2 4 4 0 004-4 1 1 0 012 0 4 4 0 004 4 1 1 0 010 2 4 4 0 00-4 4 1 1 0 01-1 1z" />
                    </svg>
                  </div>
                )}
                <MemberAvatar user={user} />
              </Link>
            </div>
            <div className="text-center">
              <Link className="inline-flex text-gray-800 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white" href={`/community/profile/${user.id}`}>
                <h2 className="text-xl leading-snug justify-center font-semibold">{user.username}</h2>
              </Link>
            </div>
            {wallet && (
              <div className="flex justify-center items-center">
                <span className="text-sm font-medium text-gray-400 dark:text-gray-500 -mt-0.5 mr-1">⛓</span>
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{wallet}</span>
              </div>
            )}
          </header>
          <div className="text-center mt-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {user.bio?.trim() || <span className="italic text-gray-400 dark:text-gray-500">No bio yet</span>}
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 dark:border-gray-700/60">
          <Link
            className="block text-center text-sm text-violet-500 hover:text-violet-600 dark:hover:text-violet-400 font-medium px-3 py-4"
            href={`/community/profile/${user.id}`}
          >
            <div className="flex items-center justify-center">
              <svg className="fill-current shrink-0 mr-2" width="16" height="16" viewBox="0 0 16 16">
                <path d="M8 0C3.6 0 0 3.1 0 7s3.6 7 8 7h.6l5.4 2v-4.4c1.2-1.2 2-2.8 2-4.6 0-3.9-3.6-7-8-7zm4 10.8v2.3L8.9 12H8c-3.3 0-6-2.2-6-5s2.7-5 6-5 6 2.2 6 5c0 2.2-2 3.8-2 3.8z" />
              </svg>
              <span>View Profile</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
