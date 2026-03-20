'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import AuthHeader from '../auth-header';
import PersonalReadingClient from '@/app/(default)/astrology/personal-reading/personal-reading-client';

export default function SignUp() {
  return (
    <main className="bg-white dark:bg-gray-900 min-h-[100dvh]">
      <div className="flex flex-col">
        <AuthHeader />
        <div className="max-w-2xl mx-auto w-full px-4 py-8">
          <div className="mb-8 text-center">
            <h2 className="text-xl text-gray-800 dark:text-gray-100 font-bold mb-3">Create Your Account</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
              Membership begins with a personal astrology reading. Purchase your reading below — your account is created automatically.
            </p>
          </div>

          <Suspense>
            <PersonalReadingClient />
          </Suspense>

          <div className="pt-5 mt-6 border-t border-gray-100 dark:border-gray-700/60 text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <Link className="font-medium text-yellow-700 hover:text-yellow-800 dark:hover:text-yellow-800" href="/signin">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
