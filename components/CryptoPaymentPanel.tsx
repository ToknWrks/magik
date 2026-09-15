'use client';

// Crypto-rail checkout panel for reading purchases.
// User pays the reading price directly in USDC on Base to the treasury,
// waits for confirmations, server verifies the transfer, then the reading
// generates. Rendered OUTSIDE Stripe's <Elements> — no Stripe hooks here.

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { erc20Abi } from 'viem';
import { base } from 'viem/chains';
import { getAppKit } from '@/lib/web3';
import { getPurchaseToken, getTreasuryAddress } from '@/lib/token';

export default function CryptoPaymentPanel({
  priceUsd,
  readingType,
  error = '',
  onVerified,
  onBack,
  title = 'Complete Your Order',
  submitLabel,
  onSwitchToStripe,
  onSwitchToTokens,
}: {
  priceUsd: number;
  readingType: 'transit' | 'birthchart';
  error?: string;
  onVerified: (cryptoPaymentId: string) => void;
  onBack: () => void;
  title?: string;
  submitLabel: string;
  onSwitchToStripe?: () => void;
  onSwitchToTokens?: () => void;
}) {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [status, setStatus] = useState('');
  const [localError, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const rail = base;
  const token = getPurchaseToken(rail.id);
  const treasury = getTreasuryAddress();

  const { data: receipt } = useWaitForTransactionReceipt({
    hash: txHash ?? undefined,
    chainId: rail.id,
  });

  async function pay() {
    setError('');
    setTxHash(null);
    setStatus('');
    if (!isConnected || !address) {
      getAppKit()?.open();
      return;
    }
    if (!token || !treasury) {
      setError('Crypto payments are temporarily unavailable.');
      return;
    }
    try {
      setStatus('Confirm in your wallet…');
      const rawAmount = BigInt(Math.round(priceUsd * 10 ** token.decimals));
      const hash = await writeContractAsync({
        address: token.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [treasury as `0x${string}`, rawAmount],
        chainId: rail.id,
      });
      setTxHash(hash);
      setStatus('Transaction submitted — waiting for confirmations (~30s)…');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transaction rejected');
    }
  }

  async function verify(hash: `0x${string}`) {
    setVerifying(true);
    setStatus('Verifying payment…');
    try {
      const res = await fetch('/api/astrology/verify-crypto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash: hash, chainId: rail.id, readingType }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Verification failed');
      setStatus('✓ Payment verified');
      onVerified(data.cryptoPaymentId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
      setTxHash(null);
      setStatus('');
    } finally {
      setVerifying(false);
    }
  }

  // Trigger verification once the receipt confirms
  if (receipt?.status === 'success' && txHash && !verifying && status.includes('waiting')) {
    verify(txHash);
  }

  if (!token || !treasury) {
    return (
      <div className="max-w-md mx-auto">
        <button onClick={onBack} className="text-sm text-gray-500 dark:text-gray-400 hover:underline mb-6">
          ← Back
        </button>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Crypto payments are coming soon. Please use card or tokens.
        </div>
      </div>
    );
  }

  const shownError = error || localError;

  return (
    <div className="max-w-md mx-auto">
      <button onClick={onBack} className="text-sm text-gray-500 dark:text-gray-400 hover:underline mb-6">
        ← Back
      </button>

      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h2>

      {/* Payment method toggle */}
      <div className="flex items-center gap-2 text-xs mb-4">
        {onSwitchToStripe && (
          <button
            type="button"
            onClick={onSwitchToStripe}
            className="px-3 py-1.5 rounded-md font-medium transition text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            💳 Card
          </button>
        )}
        <button
          type="button"
          className="px-3 py-1.5 rounded-md font-medium transition bg-gray-900 dark:bg-yellow-500 text-white dark:text-gray-900"
        >
          ⛓ Crypto
        </button>
        {onSwitchToTokens && (
          <button
            type="button"
            onClick={onSwitchToTokens}
            className="px-3 py-1.5 rounded-md font-medium transition text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            ◎ Tokens
          </button>
        )}
      </div>

      {shownError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800 dark:text-red-200">{shownError}</p>
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/60 rounded-lg p-4 space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Price</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{priceUsd} {token.symbol} (on {rail.name})</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Wallet</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Not connected'}
          </span>
        </div>
        <p className="text-xs text-gray-400">
          Send exactly {priceUsd} {token.symbol} to the treasury. Your reading generates automatically after the transaction confirms (~30s).
        </p>
      </div>

      <button
        onClick={pay}
        disabled={!!txHash || verifying}
        className={`w-full py-3 px-6 rounded-lg font-semibold text-base transition-colors ${
          txHash || verifying
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        {!address ? 'Connect Wallet & Pay' : txHash ? '⏳ Confirming…' : `Pay ${priceUsd} ${token.symbol}`}
      </button>

      {status && <div className="mt-3 text-sm text-indigo-700 dark:text-indigo-400">{status}</div>}

      <p className="mt-3 text-xs text-center text-gray-400">{submitLabel}</p>
    </div>
  );
}
