'use client';

import { useEffect, useState, Suspense } from 'react';
import SigilClient from './sigil-client';
import MemberGate from '@/components/MemberGate';

function SigilCreatorInner() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setIsLoggedIn(!!data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-sm">
          <MemberGate
            redirect="/sigil-creator"
            message="Sign in or create an account to access the Sigil Creator."
          />
        </div>
      </div>
    );
  }

  return <SigilClient />;
}

export default function SigilCreatorPage() {
  return (
    <Suspense>
      <SigilCreatorInner />
    </Suspense>
  );
}
