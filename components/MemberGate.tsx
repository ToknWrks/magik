'use client';

import Image from 'next/image';
import Link from 'next/link';

interface MemberGateProps {
  redirect: string;
  message?: string;
  /** Show a fade gradient above the gate (used when gate follows a content teaser) */
  gradient?: boolean;
}

export default function MemberGate({
  redirect,
  message = 'Sign in or create an account to access members-only content.',
  gradient = false,
}: MemberGateProps) {
  return (
    <div className="relative">
      {gradient && (
        <div className="pointer-events-none select-none absolute inset-x-0 bottom-full h-32 bg-gradient-to-t from-white dark:from-gray-950 to-transparent" />
      )}
      <div className="relative z-20 mt-4 flex flex-col items-center text-center py-10 px-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
        <div className="w-20 h-20 rounded-full overflow-hidden mb-4">
          <Image
            src="/images/Spirit14.png"
            alt="Members only"
            width={80}
            height={80}
            className="w-full h-full object-cover"
          />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Members Only</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 max-w-sm">{message}</p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Link
            href={`/signin?redirect=${redirect}`}
            className="flex-1 py-2.5 px-4 bg-yellow-700 hover:bg-yellow-800 text-white font-medium rounded-lg text-sm text-center transition-colors"
          >
            Sign In
          </Link>
          <Link
            href={`/signup?redirect=${redirect}`}
            className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium rounded-lg text-sm text-center transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
