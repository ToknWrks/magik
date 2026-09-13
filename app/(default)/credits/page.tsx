'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Boundary } from '@/components/ui/boundary';
import Link from 'next/link';
import CryptoPurchase from '@/components/web3/CryptoPurchase';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const PACKAGES = [
  {
    id: 'single',
    credits: 100,
    price: 5,
    label: 'Single Session',
    description: '1 coaching session or 2 content dialogues',
    highlight: false,
  },
  {
    id: 'standard',
    credits: 300,
    price: 12,
    label: '3-Pack',
    description: '3 coaching sessions or 6 content dialogues',
    highlight: true,
    savings: 'Save $3',
  },
  {
    id: 'premium',
    credits: 600,
    price: 20,
    label: '6-Pack',
    description: '6 coaching sessions or 12 content dialogues',
    highlight: false,
    savings: 'Save $10',
  },
];

const FEATURE_COSTS = [
  { label: 'Coaching session', credits: 100, duration: '10 min minimum' },
  { label: 'Content dialogue', credits: 50, duration: '5 min minimum' },
  { label: 'Profile image generation', credits: 20, duration: 'per image' },
];

function CheckoutForm({
  pkg,
  onSuccess,
  onBack,
}: {
  pkg: typeof PACKAGES[0];
  onSuccess: (newBalance: number) => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [cardComplete, setCardComplete] = useState({ number: false, expiry: false, cvc: false });

  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const elementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: isDark ? '#f3f4f6' : '#1f2937',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        '::placeholder': { color: isDark ? '#6b7280' : '#9ca3af' },
      },
      invalid: { color: '#ef4444' },
    },
  };

  const isReady = isDev || (cardComplete.number && cardComplete.expiry && cardComplete.cvc);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');

    try {
      let paymentIntentId: string;

      if (isDev) {
        paymentIntentId = 'dev_bypass';
      } else {
        const intentRes = await fetch('/api/credits/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packageId: pkg.id }),
        });
        const { clientSecret, error: intentError } = await intentRes.json();
        if (intentError) { setError(intentError); setLoading(false); return; }

        const cardNumber = elements.getElement(CardNumberElement);
        if (!cardNumber) { setError('Card info not found'); setLoading(false); return; }

        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: { card: cardNumber },
        });

        if (confirmError) { setError(confirmError.message || 'Payment failed'); setLoading(false); return; }
        if (paymentIntent?.status !== 'succeeded') { setError('Payment was not completed'); setLoading(false); return; }

        paymentIntentId = paymentIntent.id;
      }

      const res = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ paymentIntentId, packageId: pkg.id }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      onSuccess(data.balance);
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <button onClick={onBack} className="text-sm text-gray-500 dark:text-gray-400 hover:underline mb-6">
        ← Back
      </button>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{pkg.label}</h2>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">${pkg.price}</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{pkg.credits} tokens · {pkg.description}</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isDev ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">Dev mode — payment bypassed</p>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Card Number</label>
              <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900">
                <CardNumberElement options={elementOptions} onChange={e => setCardComplete(p => ({ ...p, number: e.complete }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry</label>
                <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900">
                  <CardExpiryElement options={elementOptions} onChange={e => setCardComplete(p => ({ ...p, expiry: e.complete }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CVC</label>
                <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900">
                  <CardCvcElement options={elementOptions} onChange={e => setCardComplete(p => ({ ...p, cvc: e.complete }))} />
                </div>
              </div>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={!isReady || loading}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-base transition-colors ${
            !isReady || loading
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-yellow-700 hover:bg-yellow-800 text-white'
          }`}
        >
          {loading ? 'Processing...' : `Pay $${pkg.price} · Get ${pkg.credits} Tokens`}
        </button>

        <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Secured by Stripe
        </p>
      </form>
    </div>
  );
}

export default function CreditsPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selected, setSelected] = useState<typeof PACKAGES[0] | null>(null);
  const [payMethod, setPayMethod] = useState<'stripe' | 'crypto'>('stripe');
  const [purchased, setPurchased] = useState(false);
  const [newBalance, setNewBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/credits/balance', { credentials: 'include' })
      .then(r => r.json()).then(d => setBalance(d.balance)).catch(() => {});
    fetch('/api/credits/history', { credentials: 'include' })
      .then(r => r.json()).then(d => setTransactions(d.transactions || [])).catch(() => {});
  }, []);

  const handleSuccess = (bal: number) => {
    setNewBalance(bal);
    setBalance(bal);
    setPurchased(true);
    setSelected(null);
  };

  if (purchased && newBalance !== null) {
    return (
      <Boundary label="Credits">
        <div className="max-w-md mx-auto text-center py-12">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-700 dark:text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Tokens Added!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-2">Your new balance:</p>
          <p className="text-4xl font-bold text-yellow-700 dark:text-yellow-500 mb-8">{newBalance} tokens</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setPurchased(false)}
              className="px-6 py-2.5 bg-yellow-700 hover:bg-yellow-800 text-white font-medium rounded-lg transition-colors text-sm"
            >
              Buy More
            </button>
            <Link
              href="/profile"
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm text-center"
            >
              Back to Profile
            </Link>
          </div>
        </div>
      </Boundary>
    );
  }

  if (selected) {
    return (
      <Boundary label="Credits">
        {payMethod === 'crypto' ? (
          <CryptoPurchase onSuccess={handleSuccess} />
        ) : stripePromise ? (
          <Elements stripe={stripePromise}>
            <CheckoutForm pkg={selected} onSuccess={handleSuccess} onBack={() => setSelected(null)} />
          </Elements>
        ) : (
          <p className="text-red-500">Stripe is not configured.</p>
        )}
      </Boundary>
    );
  }

  return (
    <Boundary label="Credits" animateRerendering={false}>
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Balance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Your balance</p>
            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              {balance !== null ? balance : '—'} <span className="text-xl font-medium text-gray-400">tokens</span>
            </p>
          </div>
          <svg className="w-10 h-10 text-yellow-200 dark:text-yellow-900" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
          </svg>
        </div>

        {/* What credits buy */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">What tokens unlock</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {FEATURE_COSTS.map(f => (
              <div key={f.label} className="px-5 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">{f.label}</span>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{f.credits} tokens</span>
                  <span className="text-xs text-gray-400 ml-2">{f.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Packages */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Choose a package</h2>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setPayMethod('stripe')}
                className={`px-3 py-1.5 rounded-md font-medium transition ${payMethod === 'stripe' ? 'bg-gray-900 dark:bg-yellow-500 text-white dark:text-gray-900' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              >
                💳 Card
              </button>
              <button
                onClick={() => setPayMethod('crypto')}
                className={`px-3 py-1.5 rounded-md font-medium transition ${payMethod === 'crypto' ? 'bg-gray-900 dark:bg-yellow-500 text-white dark:text-gray-900' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              >
                ⛓ Crypto
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PACKAGES.map(pkg => (
              <button
                key={pkg.id}
                onClick={() => setSelected(pkg)}
                className={`relative text-left p-5 rounded-xl border-2 transition-all ${
                  pkg.highlight
                    ? 'border-yellow-600 bg-yellow-50 dark:bg-yellow-900/10'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {pkg.highlight && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-yellow-700 text-white text-xs font-medium rounded-full whitespace-nowrap">
                    Most Popular
                  </span>
                )}
                {pkg.savings && (
                  <span className="absolute top-3 right-3 text-xs font-medium text-yellow-700 dark:text-yellow-500">
                    {pkg.savings}
                  </span>
                )}
                <p className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-0.5">${pkg.price}</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{pkg.label}</p>
                <p className="text-xs text-yellow-700 dark:text-yellow-500 font-semibold mb-2">{pkg.credits} tokens</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{pkg.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Transaction history */}
        {transactions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Transaction history</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {transactions.slice(0, 10).map(tx => (
                <div key={tx.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{tx.description}</p>
                    <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${tx.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </Boundary>
  );
}
