'use client';

import { useState, useEffect, useCallback } from 'react';

export function useCredits() {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/credits/balance', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
      }
    } catch {
      // not logged in or error — leave null
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  const spend = useCallback(async (amount: number, description: string): Promise<boolean> => {
    const res = await fetch('/api/credits/spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ amount, description }),
    });
    const data = await res.json();
    if (data.success) {
      setBalance(data.balance);
      return true;
    }
    return false;
  }, []);

  return { balance, loading, spend, refetch: fetchBalance };
}
