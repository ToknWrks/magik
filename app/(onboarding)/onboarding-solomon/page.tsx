'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import Image from 'next/image';
import Link from 'next/link';
import OnboardingHeader from '../onboarding-header';
import WalletAuthButton from '@/components/web3/WalletAuthButton';
import OnboardingImage from '../onboarding-image';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const PACKAGES = [
  {
    id: 'single',
    tokens: 100,
    price: 5,
    label: 'Starter',
    description: '1 coaching session',
    highlight: false,
  },
  {
    id: 'standard',
    tokens: 300,
    price: 12,
    label: '3-Pack',
    description: '3 coaching sessions',
    highlight: true,
    savings: 'Save $3',
  },
  {
    id: 'premium',
    tokens: 600,
    price: 20,
    label: '6-Pack',
    description: '6 coaching sessions',
    highlight: false,
    savings: 'Save $10',
  },
];

// ── Payment form ───────────────────────────────────────────────────────────────

function PaymentForm({
  formData,
  selectedPkg,
  onSuccess,
  onBack,
}: {
  formData: { email: string; password: string };
  selectedPkg: typeof PACKAGES[0];
  onSuccess: (accountCreated: boolean, balance: number) => void;
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
    setLoading(true);
    setError('');

    try {
      let paymentIntentId: string;

      if (isDev) {
        paymentIntentId = 'dev_bypass';
      } else {
        if (!stripe || !elements) { setError('Payment not ready.'); setLoading(false); return; }

        const intentRes = await fetch('/api/credits/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packageId: selectedPkg.id }),
        });
        const { clientSecret, error: intentError } = await intentRes.json();
        if (intentError) { setError(intentError); setLoading(false); return; }

        const cardNumber = elements.getElement(CardNumberElement);
        if (!cardNumber) { setError('Card info not found'); setLoading(false); return; }

        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: { card: cardNumber, billing_details: { email: formData.email } },
        });
        if (confirmError) { setError(confirmError.message || 'Payment failed'); setLoading(false); return; }
        if (paymentIntent?.status !== 'succeeded') { setError('Payment was not completed'); setLoading(false); return; }
        paymentIntentId = paymentIntent.id;
      }

      const res = await fetch('/api/auth/solomon-signup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId,
          packageId: selectedPkg.id,
          email: formData.email,
          password: formData.password,
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.details || data.error); setLoading(false); return; }
      onSuccess(data.accountCreated, data.balance);
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={onBack} className="text-sm text-gray-500 dark:text-gray-400 hover:underline mb-6">
        ← Back
      </button>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Complete Your Purchase</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Solomon's Path — {selectedPkg.tokens} tokens for ${selectedPkg.price}</p>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 text-sm space-y-1">
        <p><span className="text-gray-500 dark:text-gray-400">Package:</span><span className="text-gray-900 dark:text-gray-100 ml-2">{selectedPkg.label} — {selectedPkg.tokens} tokens</span></p>
        <p><span className="text-gray-500 dark:text-gray-400">Account:</span><span className="text-gray-900 dark:text-gray-100 ml-2">{formData.email}</span></p>
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
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </span>
          ) : isDev ? 'Begin Solomon\'s Path' : `Pay $${selectedPkg.price} · Begin Solomon's Path`}
        </button>

        {!isDev && (
          <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secured by Stripe
          </p>
        )}
      </form>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function OnboardingSolomon() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [step, setStep] = useState<'form' | 'payment' | 'result'>('form');
  const [selectedPkg, setSelectedPkg] = useState(PACKAGES[1]); // default 3-Pack
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setIsLoggedIn(true);
          setFormData(p => ({ ...p, email: data.user.email }));
        }
      });
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handleSuccess = (_accountCreated: boolean, newBalance: number) => {
    setBalance(newBalance);
    setStep('result');
  };

  if (step === 'result') {
    return (
      <main className="bg-white dark:bg-gray-900">
        <div className="relative flex">
          <div className="w-full md:w-1/2">
            <div className="min-h-[100dvh] h-full flex flex-col after:flex-1">
              <div className="flex-1"><OnboardingHeader /></div>
              <div className="px-4 py-8">
                <div className="max-w-md mx-auto text-center">
                  <div className="w-16 h-16 overflow-hidden rounded-full mx-auto mb-6">
                    <Image src="/images/Spirit10.png" alt="Solomon" width={64} height={64} className="object-cover w-full h-full" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Solomon Awaits</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                    Your account is ready. You have{' '}
                    <span className="font-semibold text-yellow-700 dark:text-yellow-500">{balance} tokens</span>{' '}
                    to begin your first session.
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic mb-8">
                    "Ask anything. No scripts. No limits. Only truth."
                  </p>
                  <button
                    onClick={() => router.push('/spiritual-coaching')}
                    className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white"
                  >
                    Begin Session with Solomon →
                  </button>
                </div>
              </div>
            </div>
          </div>
          <OnboardingImage />
        </div>
      </main>
    );
  }

  return (
    <main className="bg-white dark:bg-gray-900">
      <div className="relative flex">
        <div className="w-full md:w-1/2">
          <div className="min-h-[100dvh] h-full flex flex-col after:flex-1">
            <div className="flex-1"><OnboardingHeader /></div>

            <div className="px-4 py-8">
              <div className="max-w-md mx-auto">

                {step === 'payment' ? (
                  stripePromise ? (
                    <Elements stripe={stripePromise}>
                      <PaymentForm
                        formData={formData}
                        selectedPkg={selectedPkg}
                        onSuccess={handleSuccess}
                        onBack={() => setStep('form')}
                      />
                    </Elements>
                  ) : (
                    <p className="text-red-500">Stripe is not configured.</p>
                  )
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                        <Image src="/images/Spirit10.png" alt="Solomon" width={40} height={40} className="object-cover w-full h-full" />
                      </div>
                      <h1 className="text-3xl text-gray-800 dark:text-gray-100 font-bold">Solomon's Path</h1>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
                      Direct voice sessions with your spiritual guide. Ask anything — no scripts, no limits.
                    </p>

                    <form onSubmit={handleFormSubmit} className="space-y-6">

                      {/* Package selection */}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Choose your tokens</h3>
                        <div className="grid grid-cols-3 gap-3">
                          {PACKAGES.map(pkg => (
                            <button
                              key={pkg.id}
                              type="button"
                              onClick={() => setSelectedPkg(pkg)}
                              className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                                selectedPkg.id === pkg.id
                                  ? 'border-yellow-600 bg-yellow-50 dark:bg-yellow-900/10'
                                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                              }`}
                            >
                              {pkg.highlight && (
                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-yellow-700 text-white text-xs font-medium rounded-full whitespace-nowrap">
                                  Popular
                                </span>
                              )}
                              <p className="font-bold text-gray-900 dark:text-gray-100">${pkg.price}</p>
                              <p className="text-xs font-medium text-yellow-700 dark:text-yellow-500">{pkg.tokens} tokens</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{pkg.description}</p>
                              {pkg.savings && (
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{pkg.savings}</p>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Account */}
                      {!isLoggedIn && (
                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Your Account</h3>
                          {mounted && (
                            <WalletAuthButton
                              label="⛓ Connect Wallet to Continue"
                              className="[&>button]:w-full [&>button]:py-2.5"
                            />
                          )}
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                            or with email
                            <span className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Email <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="email"
                              required
                              value={formData.email}
                              onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                              placeholder="you@example.com"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Password <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="password"
                              required
                              minLength={6}
                              value={formData.password}
                              onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                              placeholder="Create a password"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                            <p className="text-xs text-gray-400 mt-1">Your account is created on purchase so your tokens and sessions are saved.</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <Link className="text-sm underline hover:no-underline" href="/illuminati-initiation">← Back</Link>
                        <button
                          type="submit"
                          className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white"
                        >
                          Continue →
                        </button>
                      </div>
                    </form>
                  </>
                )}

              </div>
            </div>
          </div>
        </div>
        <OnboardingImage />
      </div>
    </main>
  );
}
