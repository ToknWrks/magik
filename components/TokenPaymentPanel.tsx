'use client';

// Token-rail checkout panel for reading purchases.
// Crypto users buy tokens on /credits (USDC on Base), then tokens are spent here.
// Rendered OUTSIDE Stripe's <Elements> provider — must NOT use useStripe/useElements.

import { useState } from 'react';
import Link from 'next/link';

export default function TokenPaymentPanel({
  cost,
  balance,
  error = '',
  onPay,
  onBack,
  title = 'Complete Your Order',
  submitLabel,
  note,
  onSwitchToStripe,
}: {
  cost: number;
  balance?: number | null;
  error?: string;
  onPay: () => Promise<void> | void;
  onBack: () => void;
  title?: string;
  submitLabel: string;
  note?: string;
  onSwitchToStripe?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onPay();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <button onClick={onBack} className="text-sm text-gray-500 dark:text-gray-400 hover:underline mb-6">
        ← Back
      </button>

      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h2>

      {/* Payment method toggle */}
      {onSwitchToStripe && (
        <div className="flex items-center gap-2 text-xs mb-4">
          <button
            type="button"
            onClick={onSwitchToStripe}
            className="px-3 py-1.5 rounded-md font-medium transition text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            💳 Card
          </button>
          <button
            type="button"
            className="px-3 py-1.5 rounded-md font-medium transition bg-gray-900 dark:bg-yellow-500 text-white dark:text-gray-900"
          >
            ⛓ Tokens / Crypto
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/60 rounded-lg p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Cost</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{cost} tokens</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Your balance</span>
            <span className={`font-semibold ${balance != null && balance < cost ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
              {balance != null ? `${balance} tokens` : '— (sign in to view)'}
            </span>
          </div>
          {balance != null && balance < cost && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Not enough tokens.{' '}
              <Link href="/credits" className="font-medium underline text-yellow-700 dark:text-yellow-500">
                Buy tokens with USDC on Base →
              </Link>
            </p>
          )}
          {note && <p className="text-xs text-gray-400">{note}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-base transition-colors ${
            loading
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-yellow-700 hover:bg-yellow-800 text-white'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating your reading...
            </span>
          ) : (
            submitLabel
          )}
        </button>
      </form>
    </div>
  );
}
