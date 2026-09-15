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
import FormattedInterpretation from '@/components/FormattedInterpretation';
import { useLanguage } from '@/hooks/useLanguage';
import EcoContributionInfo from '@/components/EcoContributionInfo';
import LanguageSelector from '@/components/LanguageSelector';
import { READING_COST_TOKENS, useTokenBalance } from '@/hooks/useReadingPayments';
import Link from 'next/link';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const READING_PRICE = 9;
const REGEN_CONTRIBUTION = 0.25;
const PRICE = READING_PRICE + REGEN_CONTRIBUTION;

const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const ASPECTS = [
  { name: 'Conjunction', angle: 0 },
  { name: 'Sextile', angle: 60 },
  { name: 'Square', angle: 90 },
  { name: 'Trine', angle: 120 },
  { name: 'Opposition', angle: 180 },
];
// Dynamic orb limits per planet/aspect rules
function getMaxOrb(transitPlanet: string, natalPlanet: string, aspectName: string, isApplying: boolean): number {
  // Saturn return (Saturn conjunct natal Saturn)
  if (transitPlanet === 'Saturn' && natalPlanet === 'Saturn' && aspectName === 'Conjunction') return 20;
  // Saturn opposing itself
  if (transitPlanet === 'Saturn' && natalPlanet === 'Saturn' && aspectName === 'Opposition') return 10;
  // Saturn transits to any planet: 7° applying and separating
  if (transitPlanet === 'Saturn') return 7;
  // Mars transits: 9° applying, 5° separating
  if (transitPlanet === 'Mars') return isApplying ? 9 : 5;
  // Uranus return or opposition to itself
  if (transitPlanet === 'Uranus' && natalPlanet === 'Uranus' &&
    (aspectName === 'Conjunction' || aspectName === 'Opposition')) return 10;
  // Transiting planet aspecting itself (same planet) — activates earlier
  if (transitPlanet === natalPlanet) return 7;
  // Default
  return 5;
}

interface TransitAspect {
  transitPlanet: string;
  natalPlanet: string;
  aspect: string;
  aspectAngle: number;
  currentOrb: number;
  isApplying: boolean;
}

interface FormData {
  email: string;
  password: string;
  birthDate: string;
  birthTime: string;
  birthLocation: string;
  focus: string;
}

interface Reading {
  id: string;
  birth_date: string;
  birth_time: string | null;
  birth_location: string;
  report: string;
  created_at: string;
}

// ── Transit calculation utilities ────────────────────────────────────────────

function getPlanetLon(planet: string, date: Date): number {
  const vec = Astronomy.GeoVector(planet as any, date, false);
  return Astronomy.Ecliptic(vec).elon;
}

function getUnsignedOrb(lon1: number, lon2: number, aspectAngle: number): number {
  let diff = Math.abs(lon1 - lon2);
  diff = Math.min(diff, 360 - diff);
  return Math.abs(diff - aspectAngle);
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

function findActiveTransits(natalPositions: Record<string, number>): TransitAspect[] {
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const transits: TransitAspect[] = [];

  for (const transitPlanet of PLANETS) {
    const lon = getPlanetLon(transitPlanet, today);
    for (const [natalPlanet, natalLon] of Object.entries(natalPositions)) {
      for (const aspect of ASPECTS) {
        const orb = getUnsignedOrb(lon, natalLon, aspect.angle);
        if (orb > 20) continue; // quick early rejection (20° = max possible orb, Saturn return)
        const orbTomorrow = getUnsignedOrb(getPlanetLon(transitPlanet, tomorrow), natalLon, aspect.angle);
        const isApplying = orbTomorrow < orb;
        const maxOrb = getMaxOrb(transitPlanet, natalPlanet, aspect.name, isApplying);
        if (orb <= maxOrb) {
          transits.push({
            transitPlanet,
            natalPlanet,
            aspect: aspect.name,
            aspectAngle: aspect.angle,
            currentOrb: parseFloat(orb.toFixed(2)),
            isApplying,
          });
        }
      }
    }
  }

  return transits.sort((a, b) => a.currentOrb - b.currentOrb);
}

// ── ReportDisplay ─────────────────────────────────────────────────────────────

function ReportDisplay({
  reading,
  onNew,
}: {
  reading: Reading;
  onNew: () => void;
}) {
  const [isDark, setIsDark] = useState(false);
  const [selectedTransit, setSelectedTransit] = useState<TransitAspect | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [interpretation, setInterpretation] = useState('');
  const [interpretationLoading, setInterpretationLoading] = useState(false);
  const [modalChartData, setModalChartData] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });

  const sections = reading.report.split(/(?=## )/g).filter(Boolean);
  const natalPositions = calculateNatalPositions(reading.birth_date, reading.birth_time ?? undefined);
  const transits = findActiveTransits(natalPositions);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const openTransitModal = async (t: TransitAspect) => {
    const natalLon = natalPositions[t.natalPlanet];
    setSelectedTransit(t);
    setShowModal(true);
    setInterpretation('');
    setInterpretationLoading(true);

    // Chart: transit planet vs fixed natal longitude over 200 days
    const labels: string[] = [];
    const data: number[] = [];
    for (let i = -100; i <= 100; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      try {
        const lon1 = getPlanetLon(t.transitPlanet, date);
        let diff = Math.abs(lon1 - natalLon);
        diff = Math.min(diff, 360 - diff);
        if (Math.abs(diff - t.aspectAngle) <= 15) {
          data.push(parseFloat(diff.toFixed(2)));
          labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
      } catch { /* skip */ }
    }
    setModalChartData({ labels, data });

    try {
      const transitInfo = `Transiting ${t.transitPlanet} ${t.aspect} Natal ${t.natalPlanet} (orb: ${t.currentOrb}°). Use the Archetypal Astrology framework.`;
      const res = await fetch('/api/astrology/interpretations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transitInfo }),
      });
      const json = await res.json();
      setInterpretation(json.interpretation || '');
    } catch {
      setInterpretation('Error loading interpretation.');
    } finally {
      setInterpretationLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([reading.report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `astrology-reading-${reading.birth_date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const textColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your Personal Transit Reading</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {reading.birth_date} · {reading.birth_location}
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
      </div>

      {/* Claude-generated report sections */}
      <div className="space-y-6">
        {sections.map((section, i) => {
          const lines = section.trim().split('\n');
          const heading = lines[0].replace('## ', '');
          const body = lines.slice(1).join('\n').trim();
          return (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">{heading}</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{body}</p>
            </div>
          );
        })}
      </div>

      {/* Personal transit cards — tap to explore */}
      {transits.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Your Personal Transits
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Transiting planets aspecting your natal chart, within 5° orb — sorted by intensity. Tap to explore.
          </p>
          <div className="space-y-2">
            {transits.slice(0, 6).map((t, ti) => (
              <button
                key={ti}
                onClick={() => openTransitModal(t)}
                className="w-full flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
              >
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                    Transiting {t.transitPlanet} {t.aspect} Natal {t.natalPlanet}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t.currentOrb}° orb ·{' '}
                    <span className={t.isApplying ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                      {t.isApplying ? 'applying' : 'separating'}
                    </span>
                  </p>
                </div>
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 mt-6">
        <p className="text-sm text-indigo-800 dark:text-indigo-200">
          This reading is saved to your account. Access it anytime from{' '}
          <a href="/settings/readings" className="font-medium underline">Settings → My Readings</a>.
        </p>
      </div>

      <button onClick={onNew} className="mt-6 text-sm text-gray-500 dark:text-gray-400 hover:underline">
        Get another reading
      </button>

      {/* Transit modal */}
      {showModal && selectedTransit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-1 text-gray-900 dark:text-gray-100">
              Transiting {selectedTransit.transitPlanet} {selectedTransit.aspect} Natal {selectedTransit.natalPlanet}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {selectedTransit.currentOrb}° orb ·{' '}
              <span className={selectedTransit.isApplying ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                {selectedTransit.isApplying ? 'applying' : 'separating'}
              </span>
            </p>

            <div className="mb-4">
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Archetypal Interpretation:</h3>
              <div className="text-sm">
                {interpretationLoading ? (
                  <p className="text-gray-400 italic">Loading interpretation...</p>
                ) : (
                  <FormattedInterpretation text={interpretation} />
                )}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Aspect Chart:</h3>
              <div className="h-48">
                {modalChartData.data.length > 0 ? (
                  <Line
                    data={{
                      labels: modalChartData.labels,
                      datasets: [{
                        label: `${selectedTransit.transitPlanet}–Natal ${selectedTransit.natalPlanet}`,
                        data: modalChartData.data,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.4,
                        fill: false,
                        borderWidth: 2,
                        pointRadius: 0,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      animation: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: {
                          ticks: { maxTicksLimit: 7, maxRotation: 0, color: textColor, font: { size: 10 } },
                          grid: { color: gridColor },
                        },
                        y: {
                          beginAtZero: false,
                          ticks: { color: textColor, font: { size: 10 }, callback: (val) => `${val}°` },
                          grid: { color: gridColor },
                          ...(modalChartData.data.length > 0 && {
                            min: Math.min(...modalChartData.data) - 1,
                            max: Math.max(...modalChartData.data) + 1,
                          }),
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-gray-400">
                    No chart data in the 200-day window.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
              <span>Orb: {selectedTransit.currentOrb}°</span>
              <span>Aspect angle: {selectedTransit.aspectAngle}°</span>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── PaymentForm ───────────────────────────────────────────────────────────────

function PaymentForm({
  formData,
  transits,
  natalPositions,
  onSuccess,
  onBack,
  couponApplied,
  language = 'en',
  payMethod = 'stripe',
  onPayMethodChange,
  tokenBalance,
  onTokenPayment,
  tokenError = '',
}: {
  formData: FormData;
  transits: TransitAspect[];
  natalPositions: Record<string, number>;
  onSuccess: (reading: Reading, accountCreated: boolean) => void;
  onBack: () => void;
  couponApplied: string;
  language?: string;
  payMethod?: 'stripe' | 'tokens';
  onPayMethodChange?: (m: 'stripe' | 'tokens') => void;
  tokenBalance?: number | null;
  onTokenPayment?: () => void;
  tokenError?: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [cardComplete, setCardComplete] = useState({ number: false, expiry: false, cvc: false });
  const usingTokens = payMethod === 'tokens' && !!onTokenPayment;

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
      if (usingTokens) {
        // Token rail — server deducts from balance; balance check happens there
        setLoadingMsg('Generating your reading...');
        await onTokenPayment!();
        return; // parent handles success/error state
      }

      let paymentIntentId: string | undefined;
      let couponCode: string | undefined;

      if (isDev) {
        paymentIntentId = 'dev_bypass';
      } else if (couponApplied) {
        couponCode = couponApplied;
      } else {
        if (!stripe || !elements) { setError('Payment not ready. Please try again.'); setLoading(false); return; }
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
          payment_method: {
            card: cardNumber,
            billing_details: { email: formData.email },
          },
        });

        if (confirmError) { setError(confirmError.message || 'Payment failed'); setLoading(false); return; }
        if (paymentIntent?.status !== 'succeeded') { setError('Payment was not completed'); setLoading(false); return; }

        paymentIntentId = paymentIntent.id;
      }

      setLoadingMsg('Generating your reading...');
      const res = await fetch('/api/astrology/personal-reading', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId,
          couponCode,
          birthDate: formData.birthDate,
          birthTime: formData.birthTime,
          birthLocation: formData.birthLocation,
          focus: formData.focus,
          email: formData.email,
          password: formData.password || undefined,
          transits,
          language,
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      onSuccess(data.reading, data.accountCreated);
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <button onClick={onBack} className="text-sm text-gray-500 dark:text-gray-400 hover:underline mb-6">
        ← Back
      </button>

      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Complete Your Order</h2>
      <div className="mb-6 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Personal Transit Reading</span>
          <span className="text-gray-900 dark:text-gray-100">$9.00</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="flex items-center text-green-700 dark:text-green-400">
              Ecological Contribution (25x regeneration)
              <EcoContributionInfo />
            </span>
          <span className="text-green-700 dark:text-green-400">$0.25</span>
        </div>
        <div className="flex justify-between text-sm font-semibold pt-1 border-t border-gray-200 dark:border-gray-700">
          <span className="text-gray-900 dark:text-gray-100">Total</span>
          <span className="text-gray-900 dark:text-gray-100">$9.25</span>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 text-sm space-y-1">
        <p><span className="text-gray-500 dark:text-gray-400">Birth date:</span><span className="text-gray-900 dark:text-gray-100 ml-2">{formData.birthDate}</span></p>
        {formData.birthTime && <p><span className="text-gray-500 dark:text-gray-400">Birth time:</span><span className="text-gray-900 dark:text-gray-100 ml-2">{formData.birthTime}</span></p>}
        <p><span className="text-gray-500 dark:text-gray-400">Location:</span><span className="text-gray-900 dark:text-gray-100 ml-2">{formData.birthLocation}</span></p>
        {transits.length > 0 && (
          <p className="text-indigo-600 dark:text-indigo-400 pt-1">
            {transits.length} active transit{transits.length !== 1 ? 's' : ''} found within 5° orb
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {tokenError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800 dark:text-red-200">{tokenError}</p>
        </div>
      )}

      {/* Payment method toggle */}
      {onPayMethodChange && (
        <div className="flex items-center gap-2 text-xs mb-4">
          <button
            type="button"
            onClick={() => onPayMethodChange('stripe')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${!usingTokens ? 'bg-gray-900 dark:bg-yellow-500 text-white dark:text-gray-900' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            💳 Card
          </button>
          <button
            type="button"
            onClick={() => onPayMethodChange('tokens')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${usingTokens ? 'bg-gray-900 dark:bg-yellow-500 text-white dark:text-gray-900' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            ⛓ Tokens / Crypto
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {usingTokens ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/60 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Cost</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{READING_COST_TOKENS} tokens</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Your balance</span>
              <span className={`font-semibold ${tokenBalance != null && tokenBalance < READING_COST_TOKENS ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                {tokenBalance != null ? `${tokenBalance} tokens` : '— (sign in to view)'}
              </span>
            </div>
            {tokenBalance != null && tokenBalance < READING_COST_TOKENS && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Not enough tokens.{' '}
                <Link href="/credits" className="font-medium underline text-yellow-700 dark:text-yellow-500">
                  Buy tokens with USDC on Base →
                </Link>
              </p>
            )}
            <p className="text-xs text-gray-400">
              Crypto payments go through the token rail: buy tokens with USDC on Base, tokens are spent on the reading.
            </p>
          </div>
        ) : isDev ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">Dev mode — payment bypassed</p>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Card Number</label>
              <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900">
                <CardNumberElement options={elementOptions} onChange={(e) => setCardComplete(p => ({ ...p, number: e.complete }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry</label>
                <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900">
                  <CardExpiryElement options={elementOptions} onChange={(e) => setCardComplete(p => ({ ...p, expiry: e.complete }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CVC</label>
                <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900">
                  <CardCvcElement options={elementOptions} onChange={(e) => setCardComplete(p => ({ ...p, cvc: e.complete }))} />
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
          ) : usingTokens ? (
            `Spend ${READING_COST_TOKENS} Tokens & Get My Reading`
          ) : isDev ? (
            'Get My Free Reading'
          ) : (
            'Pay $9.25 & Get My Reading'
          )}
        </button>

        {!isDev && (
          <p className="text-xs text-center text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1">
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

// ── Main component ────────────────────────────────────────────────────────────

export default function PersonalReadingClient() {
  const { language, setLanguage } = useLanguage();
  const { balance: tokenBalance, refetch: refetchTokens } = useTokenBalance();
  const [payMethod, setPayMethod] = useState<'stripe' | 'tokens'>('stripe');
  const [tokenError, setTokenError] = useState('');
  const [step, setStep] = useState<'form' | 'payment' | 'result'>('form');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    birthDate: '',
    birthTime: '',
    birthLocation: '',
    focus: '',
  });
  const [transits, setTransits] = useState<TransitAspect[]>([]);
  const [natalPositions, setNatalPositions] = useState<Record<string, number>>({});
  const [reading, setReading] = useState<Reading | null>(null);
  const [accountCreated, setAccountCreated] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState('');
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [generatingReading, setGeneratingReading] = useState(false);
  const [generateError, setGenerateError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setIsLoggedIn(true);
          setFormData(p => ({ ...p, email: data.user.email }));
          // Wallet-only users default to the token rail (same rule as /credits)
          if (data.user.wallet_address && !data.user.email) setPayMethod('tokens');
        }
      });
  }, []);

  // Token rail payment: POST with useCredits — server deducts 250 tokens atomically
  const handleTokenPayment = async () => {
    setTokenError('');
    try {
      const res = await fetch('/api/astrology/personal-reading', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useCredits: true,
          birthDate: formData.birthDate,
          birthTime: formData.birthTime,
          birthLocation: formData.birthLocation,
          focus: formData.focus,
          email: formData.email,
          password: formData.password || undefined,
          transits,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTokenError(data.error || 'Failed to generate reading');
        await refetchTokens();
        return;
      }
      handleSuccess(data.reading, data.accountCreated);
    } catch (err: any) {
      setTokenError(err?.message || 'Failed to generate reading');
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await fetch('/api/invite/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim() }),
      });
      const data = await res.json();
      if (data.valid && data.type === 'free_reading') {
        setCouponApplied(couponInput.trim());
      } else {
        setCouponError(data.error || 'Invalid code');
      }
    } catch {
      setCouponError('Failed to validate. Try again.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleSuccess = (r: Reading, created: boolean) => {
    setReading(r);
    setAccountCreated(created);
    setStep('result');
  };

  const handleNew = () => {
    setFormData({ email: formData.email, password: '', birthDate: '', birthTime: '', birthLocation: '', focus: '' });
    setReading(null);
    setTransits([]);
    setCouponApplied('');
    setCouponInput('');
    setStep('form');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const natal = calculateNatalPositions(formData.birthDate, formData.birthTime);
    const active = findActiveTransits(natal);
    setNatalPositions(natal);
    setTransits(active);

    if (couponApplied) {
      // Skip payment — generate directly like dev bypass
      setGeneratingReading(true);
      setGenerateError('');
      try {
        const res = await fetch('/api/astrology/personal-reading', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            couponCode: couponApplied,
            birthDate: formData.birthDate,
            birthTime: formData.birthTime,
            birthLocation: formData.birthLocation,
            focus: formData.focus,
            email: formData.email,
            password: formData.password || undefined,
            transits: active,
            language,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setGenerateError(data.error || 'Failed to generate reading');
          return;
        }
        handleSuccess(data.reading, data.accountCreated);
      } catch (err: any) {
        setGenerateError(err?.message || 'Failed to generate reading');
      } finally {
        setGeneratingReading(false);
      }
      return;
    }

    setStep('payment');
  };

  if (step === 'result' && reading) {
    return (
      <div className="p-6">
        {accountCreated && (
          <div className="max-w-2xl mx-auto mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ Your account has been created with <strong>{formData.email}</strong>. Sign in anytime to access your readings.
            </p>
          </div>
        )}
        <ReportDisplay reading={reading} onNew={handleNew} />
      </div>
    );
  }

  if (step === 'payment') {
    if (payMethod === 'tokens') {
      // Token rail — no Stripe needed
      return (
        <div className="p-6">
          <PaymentForm
            formData={formData}
            transits={transits}
            natalPositions={natalPositions}
            onSuccess={handleSuccess}
            onBack={() => setStep('form')}
            couponApplied={couponApplied}
            language={language}
            payMethod={payMethod}
            onPayMethodChange={m => { setPayMethod(m); setTokenError(''); }}
            tokenBalance={tokenBalance}
            onTokenPayment={handleTokenPayment}
            tokenError={tokenError}
          />
        </div>
      );
    }
    return (
      <div className="p-6">
        {stripePromise ? (
          <Elements stripe={stripePromise}>
            <PaymentForm
              formData={formData}
              transits={transits}
              natalPositions={natalPositions}
              onSuccess={handleSuccess}
              onBack={() => setStep('form')}
              couponApplied={couponApplied}
              language={language}
              payMethod={payMethod}
              onPayMethodChange={m => { setPayMethod(m); setTokenError(''); }}
              tokenBalance={tokenBalance}
              onTokenPayment={handleTokenPayment}
              tokenError={tokenError}
            />
          </Elements>
        ) : (
          <p className="text-red-500">Stripe is not configured.</p>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-l font-bold text-gray-900 dark:text-gray-100 mb-2">Personal Transit Reading</h3>
          <p className="text-gray-500 dark:text-gray-400">
            A personalized archetypal astrology reading based on your natal chart and today's transits. One-time — $9 or 250 tokens.
          </p>
        </div>
        <LanguageSelector value={language} onChange={setLanguage} className="flex-shrink-0 mt-1" />
      </div>

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
                required={!couponApplied}
                minLength={6}
                value={formData.password}
                onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                placeholder="Create a password for your account"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <p className="text-xs text-gray-400 mt-1">Your account is created automatically so you can access your reading later.</p>
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
              Birth Time <span className="text-gray-400 font-normal">(optional but improves accuracy)</span>
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
            placeholder="Is there an area of life you'd like the reading to focus on? e.g. career, relationships, a major decision..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
          />
        </div>

        {/* Invite code */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invite Code <span className="text-gray-400 font-normal">(optional)</span></label>
          {couponApplied ? (
            <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium text-green-800 dark:text-green-200">Code applied: <span className="font-mono">{couponApplied.toUpperCase()}</span></span>
              </div>
              <button type="button" onClick={() => { setCouponApplied(''); setCouponInput(''); }} className="text-xs text-green-600 dark:text-green-400 hover:underline">Remove</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={e => { setCouponInput(e.target.value); setCouponError(''); }}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                placeholder="Enter invite code"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={!couponInput.trim() || validatingCoupon}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
              >
                {validatingCoupon ? '...' : 'Apply'}
              </button>
            </div>
          )}
          {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
        </div>

        {generateError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-800 dark:text-red-200">{generateError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={generatingReading}
          className="w-full py-3 px-6 bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-yellow-700 font-semibold rounded-xl text-base transition-colors"
        >
          {generatingReading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating your reading...
            </span>
          ) : couponApplied ? 'Get My Free Reading' : 'Continue'}
        </button>
      </form>
    </div>
  );
}
