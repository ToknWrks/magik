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
import * as Astronomy from 'astronomy-engine';
import Link from 'next/link';
import OnboardingHeader from '../onboarding-header';
import OnboardingImage from '../onboarding-image';
import OnboardingProgress from '../onboarding-progress';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const PRICE = 23;

const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const ASPECTS = [
  { name: 'Conjunction', angle: 0 },
  { name: 'Sextile', angle: 60 },
  { name: 'Square', angle: 90 },
  { name: 'Trine', angle: 120 },
  { name: 'Opposition', angle: 180 },
];

function getPlanetLon(planet: string, date: Date): number {
  const vec = Astronomy.GeoVector(planet as any, date, false);
  return Astronomy.Ecliptic(vec).elon;
}

function calculateNatalPositions(birthDate: string, birthTime?: string): Record<string, number> {
  const [year, month, day] = birthDate.split('-').map(Number);
  let hours = 12, minutes = 0;
  if (birthTime) [hours, minutes] = birthTime.split(':').map(Number);
  const date = new Date(year, month - 1, day, hours, minutes);
  const positions: Record<string, number> = {};
  for (const planet of PLANETS) {
    try { positions[planet] = getPlanetLon(planet, date); } catch { /* skip */ }
  }
  return positions;
}

function findActiveTransits(natalPositions: Record<string, number>) {
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const transits: any[] = [];
  for (const transitPlanet of PLANETS) {
    const lon = getPlanetLon(transitPlanet, today);
    for (const [natalPlanet, natalLon] of Object.entries(natalPositions)) {
      for (const aspect of ASPECTS) {
        let diff = Math.abs(lon - natalLon);
        diff = Math.min(diff, 360 - diff);
        const orb = Math.abs(diff - aspect.angle);
        if (orb <= 15) {
          let diffT = Math.abs(getPlanetLon(transitPlanet, tomorrow) - natalLon);
          diffT = Math.min(diffT, 360 - diffT);
          const orbTomorrow = Math.abs(diffT - aspect.angle);
          transits.push({ transitPlanet, natalPlanet, aspect: aspect.name, aspectAngle: aspect.angle, currentOrb: parseFloat(orb.toFixed(2)), isApplying: orbTomorrow < orb });
        }
      }
    }
  }
  return transits.sort((a, b) => a.currentOrb - b.currentOrb);
}

// ── Payment form ──────────────────────────────────────────────────────────────

function PaymentForm({
  formData,
  transits,
  natalPositions,
  onSuccess,
  onBack,
}: {
  formData: any;
  transits: any[];
  natalPositions: Record<string, number>;
  onSuccess: (birthChartReading: any, transitReading: any, accountCreated: boolean) => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
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
        setLoadingMsg('Processing payment...');
        const intentRes = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: PRICE }),
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

      setLoadingMsg('Generating your Full Initiation Reading...');
      const res = await fetch('/api/astrology/full-reading', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId,
          birthDate: formData.birthDate,
          birthTime: formData.birthTime,
          birthLocation: formData.birthLocation,
          focus: formData.focus,
          email: formData.email,
          password: formData.password || undefined,
          transits,
          natalPositions,
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.details || data.error); setLoading(false); return; }
      onSuccess(data.birthChartReading, data.transitReading, data.accountCreated);
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  return (
    <div>
      <button onClick={onBack} className="text-sm text-gray-500 dark:text-gray-400 hover:underline mb-6">
        ← Back
      </button>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Complete Your Initiation</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Full Initiation Reading — $23.00</p>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 text-sm space-y-1">
        <p><span className="text-gray-500 dark:text-gray-400">Birth date:</span><span className="text-gray-900 dark:text-gray-100 ml-2">{formData.birthDate}</span></p>
        {formData.birthTime && <p><span className="text-gray-500 dark:text-gray-400">Birth time:</span><span className="text-gray-900 dark:text-gray-100 ml-2">{formData.birthTime}</span></p>}
        <p><span className="text-gray-500 dark:text-gray-400">Location:</span><span className="text-gray-900 dark:text-gray-100 ml-2">{formData.birthLocation}</span></p>
        {transits.length > 0 && (
          <p className="text-yellow-600 dark:text-yellow-500 pt-1">
            {transits.length} active transit{transits.length !== 1 ? 's' : ''} found within 15° orb
          </p>
        )}
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
              {loadingMsg || 'Processing...'}
            </span>
          ) : isDev ? 'Begin My Initiation' : `Pay $${PRICE}.00 · Begin My Initiation`}
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

// ── Result display ────────────────────────────────────────────────────────────

function ReadingReport({ report }: { report: string }) {
  const sections = report.split(/(?=## )/g).filter(Boolean);
  return (
    <div className="space-y-4">
      {sections.map((section: string, i: number) => {
        const lines = section.trim().split('\n');
        const heading = lines[0].replace('## ', '');
        const body = lines.slice(1).join('\n').trim();
        return (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">{heading}</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{body}</p>
          </div>
        );
      })}
    </div>
  );
}

function ReadingResult({
  birthChartReading,
  transitReading,
  accountCreated,
  email,
}: {
  birthChartReading: any;
  transitReading: any;
  accountCreated: boolean;
  email: string;
}) {
  const [activeTab, setActiveTab] = useState<'birthchart' | 'transit'>('birthchart');
  const ref = birthChartReading || transitReading;

  return (
    <div>
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-yellow-700 dark:text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Your Initiation Begins</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{ref?.birth_date} · {ref?.birth_location}</p>
      </div>

      {accountCreated && (
        <div className="mb-5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <p className="text-sm text-green-800 dark:text-green-200">
            Account created for <strong>{email}</strong>. Sign in anytime to access your readings. Also includes 100 tokens for Solomon coaching.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-5">
        <button
          onClick={() => setActiveTab('birthchart')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'birthchart'
              ? 'bg-yellow-700 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Birth Chart
        </button>
        <button
          onClick={() => setActiveTab('transit')}
          className={`flex-1 py-2 text-sm font-medium transition-colors border-l border-gray-200 dark:border-gray-700 ${
            activeTab === 'transit'
              ? 'bg-yellow-700 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Transit Reading
        </button>
      </div>

      {activeTab === 'birthchart' && birthChartReading && (
        <ReadingReport report={birthChartReading.report} />
      )}
      {activeTab === 'transit' && transitReading && (
        <ReadingReport report={transitReading.report} />
      )}

      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-200 dark:border-yellow-800/60">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          Both readings are saved to your account. Access them anytime from{' '}
          <a href="/settings/readings" className="font-medium underline">Settings → My Readings</a>.
        </p>
      </div>

      <div className="mt-6 flex justify-center">
        <Link
          href="/profile"
          className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white"
        >
          Enter the Inner Circle →
        </Link>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Onboarding03() {
  const [step, setStep] = useState<'form' | 'payment' | 'result'>('form');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    birthDate: '',
    birthTime: '',
    birthLocation: '',
    focus: '',
  });
  const [transits, setTransits] = useState<any[]>([]);
  const [natalPositions, setNatalPositions] = useState<Record<string, number>>({});
  const [birthChartReading, setBirthChartReading] = useState<any>(null);
  const [transitReading, setTransitReading] = useState<any>(null);
  const [accountCreated, setAccountCreated] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
    const natal = calculateNatalPositions(formData.birthDate, formData.birthTime);
    setNatalPositions(natal);
    setTransits(findActiveTransits(natal));
    setStep('payment');
  };

  const handleSuccess = (bc: any, tr: any, created: boolean) => {
    setBirthChartReading(bc);
    setTransitReading(tr);
    setAccountCreated(created);
    setStep('result');
  };

  const showProgress = step !== 'result';

  return (
    <main className="bg-white dark:bg-gray-900">
      <div className="relative flex">
        <div className="w-full md:w-1/2">
          <div className="min-h-[100dvh] h-full flex flex-col after:flex-1">
            <div className="flex-1">
              <OnboardingHeader />
              {showProgress && <OnboardingProgress step={3} total={3} />}
            </div>

            <div className="px-4 py-8">
              <div className="max-w-md mx-auto">

                {step === 'result' && (birthChartReading || transitReading) ? (
                  <ReadingResult birthChartReading={birthChartReading} transitReading={transitReading} accountCreated={accountCreated} email={formData.email} />
                ) : step === 'payment' ? (
                  stripePromise ? (
                    <Elements stripe={stripePromise}>
                      <PaymentForm
                        formData={formData}
                        transits={transits}
                        natalPositions={natalPositions}
                        onSuccess={handleSuccess}
                        onBack={() => setStep('form')}
                      />
                    </Elements>
                  ) : (
                    <p className="text-red-500">Stripe is not configured.</p>
                  )
                ) : (
                  <>
                    <h1 className="text-3xl text-gray-800 dark:text-gray-100 font-bold mb-2">Full Initiation</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
                      Your complete birth chart interpretation plus a personal transit reading. One-time — $23.
                    </p>

                    <form onSubmit={handleFormSubmit} className="space-y-5">
                      {!isLoggedIn && (
                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Your Account</h3>
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
                            <p className="text-xs text-gray-400 mt-1">Your account is created so you can access your reading anytime.</p>
                          </div>
                        </div>
                      )}

                      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Birth Details</h3>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Birth Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            required
                            value={formData.birthDate}
                            onChange={e => setFormData(p => ({ ...p, birthDate: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Birth Time <span className="text-gray-400 font-normal">(optional — improves accuracy)</span>
                          </label>
                          <input
                            type="time"
                            value={formData.birthTime}
                            onChange={e => setFormData(p => ({ ...p, birthTime: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Birth Location <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.birthLocation}
                            onChange={e => setFormData(p => ({ ...p, birthLocation: e.target.value }))}
                            placeholder="City, Country (e.g. Chicago, USA)"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      </div>

                      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Focus or Question <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <textarea
                          rows={3}
                          value={formData.focus}
                          onChange={e => setFormData(p => ({ ...p, focus: e.target.value }))}
                          placeholder="Is there an area of life you'd like the reading to focus on? e.g. purpose, relationships, a major decision..."
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Link className="text-sm underline hover:no-underline" href="/onboarding-02">← Back</Link>
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
