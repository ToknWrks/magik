'use client';

// Shared payment-method state + token checkout helpers for reading purchase flows.
// Card (Stripe) vs tokens: crypto users buy tokens first via /credits (same
// verify-crypto rail), then spend tokens on the reading.

import { useState, useEffect, useCallback } from 'react';

import { READING_TOKENS, FULL_INITIATION_TOKENS } from '@/lib/reading-pricing';

// Backwards-compatible aliases
export const READING_COST_TOKENS = READING_TOKENS;
export const FULL_INITIATION_COST_TOKENS = FULL_INITIATION_TOKENS;

export function useTokenBalance() {
  const [balance, setBalance] = useState<number | null>(null);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch('/api/credits/balance', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setBalance(typeof data.balance === 'number' ? data.balance : null);
      } else {
        setBalance(null);
      }
    } catch {
      setBalance(null);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { balance, refetch };
}

export function usePayMethod(defaultFromWallet = true) {
  const [payMethod, setPayMethod] = useState<'stripe' | 'tokens'>('stripe');

  useEffect(() => {
    if (!defaultFromWallet) return;
    // Wallet-only users default to the token rail (same rule as /credits)
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.user?.wallet_address && !d.user.email) setPayMethod('tokens'); })
      .catch(() => {});
  }, [defaultFromWallet]);

  return { payMethod, setPayMethod };
}
