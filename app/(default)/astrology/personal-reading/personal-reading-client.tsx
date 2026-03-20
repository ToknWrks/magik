'use client';

import { useState, useEffect, useRef } from 'react';
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

const PRICE = 9;

const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const ASPECTS = [
  { name: 'Conjunction', angle: 0 },
  { name: 'Sextile', angle: 60 },
  { name: 'Square', angle: 90 },
  { name: 'Trine', angle: 120 },
  { name: 'Opposition', angle: 180 },
];
const ORB_LIMIT = 15;

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

function getSignedOrb(transitPlanet: string, natalLon: number, aspectAngle: number, date: Date): number {
  const orb = getUnsignedOrb(getPlanetLon(transitPlanet, date), natalLon, aspectAngle);
  const tomorrow = new Date(date.getTime() + 86_400_000);
  const orbTomorrow = getUnsignedOrb(getPlanetLon(transitPlanet, tomorrow), natalLon, aspectAngle);
  // applying = orb shrinking = negative
  return orbTomorrow < orb ? -orb : orb;
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
        if (orb <= ORB_LIMIT) {
          const orbTomorrow = getUnsignedOrb(getPlanetLon(transitPlanet, tomorrow), natalLon, aspect.angle);
          transits.push({
            transitPlanet,
            natalPlanet,
            aspect: aspect.name,
            aspectAngle: aspect.angle,
            currentOrb: parseFloat(orb.toFixed(2)),
            isApplying: orbTomorrow < orb,
          });
        }
      }
    }
  }

  return transits.sort((a, b) => a.currentOrb - b.currentOrb);
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function findTransitDates(transitPlanet: string, natalLon: number, aspectAngle: number) {
  const today = new Date();

  // Scan backward to find when this transit entered orb
  let entryDate: Date | null = null;
  for (let i = 0; i >= -365; i--) {
    const date = new Date(today.getTime() + i * 86_400_000);
    try {
      const orb = getUnsignedOrb(getPlanetLon(transitPlanet, date), natalLon, aspectAngle);
      if (orb > ORB_LIMIT) {
        entryDate = new Date(today.getTime() + (i + 1) * 86_400_000);
        break;
      }
    } catch { break; }
  }

  // Scan forward to find when this transit leaves orb
  let exitDate: Date | null = null;
  for (let i = 0; i <= 365; i++) {
    const date = new Date(today.getTime() + i * 86_400_000);
    try {
      const orb = getUnsignedOrb(getPlanetLon(transitPlanet, date), natalLon, aspectAngle);
      if (orb > ORB_LIMIT) {
        exitDate = new Date(today.getTime() + (i - 1) * 86_400_000);
        break;
      }
    } catch { break; }
  }

  // Find exact date (minimum orb) between entry and exit
  let exactDate: Date | null = null;
  let minOrb = Infinity;
  const startI = entryDate ? Math.round((entryDate.getTime() - today.getTime()) / 86_400_000) : -30;
  const endI = exitDate ? Math.round((exitDate.getTime() - today.getTime()) / 86_400_000) : 30;
  for (let i = startI; i <= endI; i++) {
    const date = new Date(today.getTime() + i * 86_400_000);
    try {
      const orb = getUnsignedOrb(getPlanetLon(transitPlanet, date), natalLon, aspectAngle);
      if (orb < minOrb) { minOrb = orb; exactDate = date; }
    } catch { /* skip */ }
  }

  return { entryDate, exactDate, exitDate };
}

function buildTransitDescription(
  transitPlanet: string,
  natalPlanet: string,
  aspect: string,
  entryDate: Date | null,
  exactDate: Date | null,
  exitDate: Date | null,
): string {
  const today = new Date();

  const entryPast = entryDate && entryDate <= today;
  const exactPast = exactDate && exactDate <= today;

  let desc = '';

  if (entryDate) {
    desc += entryPast
      ? `This transit entered orb on ${fmtDate(entryDate)}`
      : `This transit will begin to make itself felt when it enters orb on ${fmtDate(entryDate)}`;
  } else {
    desc += 'This transit has been active for an extended period';
  }

  if (exactDate) {
    desc += exactPast
      ? `, was exact on ${fmtDate(exactDate)} (0°) — its peak intensity`
      : ` and will be exact on ${fmtDate(exactDate)} (0°) where it will be most intense`;
  }

  if (exitDate) {
    desc += `, and will diminish in intensity until ${fmtDate(exitDate)} when it leaves the orb of influence.`;
  } else {
    desc += '. This influence is long-lasting and may remain active for an extended period.';
  }

  return desc;
}

function generateChartData(transitPlanet: string, natalLon: number, aspectAngle: number) {
  const labels: string[] = [];
  const data: (number | null)[] = [];
  const today = new Date();

  for (let i = -30; i <= 30; i++) {
    const date = new Date(today.getTime() + i * 86_400_000);
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    labels.push(label);
    try {
      const signed = getSignedOrb(transitPlanet, natalLon, aspectAngle, date);
      // Plot -|orb| so 0 (exact) is at top, -7.5 at the edges → bell curve shape
      data.push(Math.abs(signed) <= ORB_LIMIT ? parseFloat((-Math.abs(signed)).toFixed(2)) : null);
    } catch {
      data.push(null);
    }
  }
  return { labels, data };
}

// ── TransitChart component ────────────────────────────────────────────────────

function TransitChart({
  transitPlanet,
  natalPlanet,
  aspect,
  aspectAngle,
  natalLon,
  isDark,
  interpretation,
}: {
  transitPlanet: string;
  natalPlanet: string;
  aspect: string;
  aspectAngle: number;
  natalLon: number;
  isDark: boolean;
  interpretation?: string;
}) {
  const { labels, data } = generateChartData(transitPlanet, natalLon, aspectAngle);
  const hasData = data.some(d => d !== null);
  if (!hasData) return null;

  const { entryDate, exactDate, exitDate } = findTransitDates(transitPlanet, natalLon, aspectAngle);
  const description = buildTransitDescription(transitPlanet, natalPlanet, aspect, entryDate, exactDate, exitDate);

  const textColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const zeroLineColor = isDark ? 'rgba(99,102,241,0.6)' : 'rgba(99,102,241,0.5)';

  return (
    <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-4">
      <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
        Transit {transitPlanet} {aspect} Natal {natalPlanet}
      </p>
      {interpretation && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">{interpretation}</p>
      )}
      {!interpretation && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 italic">Loading interpretation...</p>
      )}
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">{description}</p>
      <div className="h-28">
        <Line
          data={{
            labels,
            datasets: [
              {
                data,
                borderColor: 'rgb(99,102,241)',
                backgroundColor: 'rgba(99,102,241,0.1)',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                fill: false,
                spanGaps: false,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: { label: (ctx) => `${Math.abs(ctx.parsed.y as number).toFixed(1)}°` },
              },
            },
            scales: {
              x: {
                ticks: { maxTicksLimit: 7, maxRotation: 0, color: textColor, font: { size: 10 } },
                grid: { color: gridColor },
              },
              y: {
                min: -(ORB_LIMIT + 1),
                max: 0,
                ticks: {
                  stepSize: 5,
                  color: textColor,
                  font: { size: 10 },
                  callback: (val) => `${Math.abs(val as number)}°`,
                },
                grid: {
                  color: (ctx) => ctx.tick.value === 0 ? zeroLineColor : gridColor,
                  lineWidth: (ctx) => (ctx.tick.value === 0 ? 2 : 1),
                },
              },
            },
          }}
        />
      </div>
      <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-1">
        0° = exact (peak intensity) · {ORB_LIMIT}° = edge of orb
      </p>
    </div>
  );
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
  const [interpretations, setInterpretations] = useState<Record<string, string>>({});
  const sections = reading.report.split(/(?=## )/g).filter(Boolean);

  // Calculate natal positions and active transits
  const natalPositions = calculateNatalPositions(reading.birth_date, reading.birth_time ?? undefined);
  const transits = findActiveTransits(natalPositions);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Fetch interpretations for each transit in parallel
  useEffect(() => {
    if (transits.length === 0) return;
    Promise.all(
      transits.slice(0, 6).map(async (t) => {
        const key = `${t.transitPlanet}-${t.aspect}-${t.natalPlanet}`;
        const transitInfo = `Transit ${t.transitPlanet} ${t.aspect} Natal ${t.natalPlanet} (orb: ${t.currentOrb}°). Use the Archetypal Astrology framework.`;
        const res = await fetch('/api/astrology/interpretations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transitInfo }),
        });
        const data = await res.json();
        return { key, text: data.interpretation || '' };
      })
    ).then(results => {
      const map: Record<string, string> = {};
      results.forEach(r => { map[r.key] = r.text; });
      setInterpretations(map);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reading.id]);

  const handleDownload = () => {
    const blob = new Blob([reading.report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `astrology-reading-${reading.birth_date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

      {/* Dedicated personal transit charts — separate from Claude's text */}
      {transits.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Your Personal Transit Charts
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Transiting planets aspecting your natal chart, within 15° orb — sorted by intensity.
          </p>
          <div className="space-y-6">
            {transits.slice(0, 6).map((t, ti) => (
              <TransitChart
                key={ti}
                transitPlanet={t.transitPlanet}
                natalPlanet={t.natalPlanet}
                aspect={t.aspect}
                aspectAngle={t.aspectAngle}
                natalLon={natalPositions[t.natalPlanet]}
                isDark={isDark}
                interpretation={interpretations[`${t.transitPlanet}-${t.aspect}-${t.natalPlanet}`]}
              />
            ))}
          </div>
        </div>
      )}

      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
        <p className="text-sm text-indigo-800 dark:text-indigo-200">
          This reading is saved to your account. Access it anytime from{' '}
          <a href="/settings/readings" className="font-medium underline">Settings → My Readings</a>.
        </p>
      </div>

      <button onClick={onNew} className="mt-6 text-sm text-gray-500 dark:text-gray-400 hover:underline">
        Get another reading
      </button>
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
}: {
  formData: FormData;
  transits: TransitAspect[];
  natalPositions: Record<string, number>;
  onSuccess: (reading: Reading, accountCreated: boolean) => void;
  onBack: () => void;
  couponApplied: string;
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
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.details ? `${data.error}: ${data.details}` : data.error); setLoading(false); return; }
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
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Personal Transit Reading — $9.00</p>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 text-sm space-y-1">
        <p><span className="text-gray-500 dark:text-gray-400">Birth date:</span><span className="text-gray-900 dark:text-gray-100 ml-2">{formData.birthDate}</span></p>
        {formData.birthTime && <p><span className="text-gray-500 dark:text-gray-400">Birth time:</span><span className="text-gray-900 dark:text-gray-100 ml-2">{formData.birthTime}</span></p>}
        <p><span className="text-gray-500 dark:text-gray-400">Location:</span><span className="text-gray-900 dark:text-gray-100 ml-2">{formData.birthLocation}</span></p>
        {transits.length > 0 && (
          <p className="text-indigo-600 dark:text-indigo-400 pt-1">
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
        ) : couponApplied ? (
          /* Coupon applied — no card needed */
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">Invite code applied</p>
                <p className="text-xs text-green-600 dark:text-green-400 font-mono">{couponApplied.toUpperCase()}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setCouponApplied(''); setCouponInput(''); }}
              className="text-xs text-green-600 dark:text-green-400 hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <>
            {/* Coupon field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invite Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={e => { setCouponInput(e.target.value); setCouponError(''); }}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                  placeholder="Have a code? Enter it here"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal"
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
              {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span>or pay by card</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

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
          ) : couponApplied || isDev ? (
            'Get My Free Reading'
          ) : (
            'Pay $9.00 & Get My Reading'
          )}
        </button>

        {!couponApplied && !isDev && (
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
        }
      });
  }, []);

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
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setGenerateError(data.details ? `${data.error}: ${data.details}` : (data.error || 'Failed to generate reading'));
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Personal Transit Reading</h1>
        <p className="text-gray-500 dark:text-gray-400">
          A personalized archetypal astrology reading based on your natal chart and today's transits. One-time — $9.
        </p>
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invite Code <span className="text-gray-400 font-normal">(optional — waives payment)</span></label>
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
