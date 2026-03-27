'use client';

import { useState, useEffect, useRef } from 'react';
import MemberGate from '@/components/MemberGate';
import * as Astronomy from 'astronomy-engine';
import { astrologySymbols } from '../symbols';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ALL_PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

const ASPECTS = [
  { name: 'Conjunction', angle: 0,   color: '#22D3EE' }, // cyan-400
  { name: 'Opposition',  angle: 180, color: '#0E7490' }, // cyan-700
  { name: 'Square',      angle: 90,  color: '#0891B2' }, // cyan-600
  { name: 'Trine',       angle: 120, color: '#2DD4BF' }, // teal-400
  { name: 'Sextile',     angle: 60,  color: '#14B8A6' }, // teal-500
];

const ZODIAC = [
  '♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓',
];

function getPlanetPositions(date: Date): Record<string, number> {
  const positions: Record<string, number> = {};
  for (const planet of ALL_PLANETS) {
    try {
      const vec = Astronomy.GeoVector(planet as any, date, false);
      positions[planet] = Astronomy.Ecliptic(vec).elon;
    } catch { /* skip */ }
  }
  return positions;
}

// Convert ecliptic longitude to canvas x,y
// 0° Aries at top, clockwise
function lonToXY(lon: number, radius: number, cx: number, cy: number): [number, number] {
  const a = ((lon - 90) * Math.PI) / 180;
  return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
}

interface ActiveAspect {
  transitPlanet: string;
  natalPlanet:   string;
  aspectName:    string;
  aspectColor:   string;
  orb:           number;
  transitLon:    number;
  natalLon:      number;
}


export default function TransitChartClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [orb,             setOrb]             = useState(3);
  const [selectedPlanets, setSelectedPlanets] = useState<Set<string>>(new Set(ALL_PLANETS));
  const [selectedAspects, setSelectedAspects] = useState<Set<string>>(new Set(ASPECTS.map(a => a.name)));

  const [natalPositions,   setNatalPositions]   = useState<Record<string, number>>({});
  const [transitPositions, setTransitPositions] = useState<Record<string, number>>({});
  const [activeAspects,    setActiveAspects]    = useState<ActiveAspect[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState('');
  const [birthLabel,       setBirthLabel]       = useState('');
  const [isDark,           setIsDark]           = useState(false);
  const [isLoggedIn,       setIsLoggedIn]       = useState(false);

  // Modal
  const [showModal,            setShowModal]            = useState(false);
  const [modalAspect,          setModalAspect]          = useState<ActiveAspect | null>(null);
  const [modalChartData,       setModalChartData]       = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
  const [interpretation,       setInterpretation]       = useState('');
  const [interpretationLoading,setInterpretationLoading]= useState(false);

  // Track dark mode
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  // Load natal + transit positions
  useEffect(() => {
    const load = async () => {
      try {
        const auth = await fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json());
        setIsLoggedIn(!!auth.user);
        if (!auth.user) { setLoading(false); return; }
        const res = await fetch('/api/astrology/readings', { credentials: 'include' });
        if (res.status === 401) {
          setError('Sign in and get a personal reading to view your transit chart.');
          setLoading(false);
          return;
        }
        if (!res.ok) { setError('Failed to load your birth data.'); setLoading(false); return; }

        const data = await res.json();
        if (!data.readings?.length) {
          setError('No readings found. Get a personal reading first.');
          setLoading(false);
          return;
        }

        const reading = data.readings[0];
        const birthDate = new Date(reading.birth_date);
        if (reading.birth_time) {
          const [h, m] = reading.birth_time.split(':').map(Number);
          if (!isNaN(h)) birthDate.setHours(h, m || 0, 0, 0);
        }
        setBirthLabel(
          `${reading.birth_date}${reading.birth_time ? ' ' + reading.birth_time : ''} · ${reading.birth_location}`,
        );
        setNatalPositions(getPlanetPositions(birthDate));
        setTransitPositions(getPlanetPositions(new Date()));
        setLoading(false);
      } catch {
        setError('Failed to load birth chart data.');
        setLoading(false);
      }
    };
    load();
  }, []);

  // Recalculate active aspects whenever filters or positions change
  useEffect(() => {
    if (!Object.keys(natalPositions).length || !Object.keys(transitPositions).length) return;

    const aspects: ActiveAspect[] = [];
    for (const tPlanet of ALL_PLANETS) {
      if (!selectedPlanets.has(tPlanet)) continue;
      const tLon = transitPositions[tPlanet];
      if (tLon === undefined) continue;

      for (const nPlanet of ALL_PLANETS) {
        const nLon = natalPositions[nPlanet];
        if (nLon === undefined) continue;

        let diff = Math.abs(tLon - nLon);
        diff = Math.min(diff, 360 - diff);

        for (const asp of ASPECTS) {
          if (!selectedAspects.has(asp.name)) continue;
          const aspOrb = Math.abs(diff - asp.angle);
          if (aspOrb <= orb) {
            aspects.push({
              transitPlanet: tPlanet,
              natalPlanet:   nPlanet,
              aspectName:    asp.name,
              aspectColor:   asp.color,
              orb:           aspOrb,
              transitLon:    tLon,
              natalLon:      nLon,
            });
          }
        }
      }
    }
    aspects.sort((a, b) => a.orb - b.orb);
    setActiveAspects(aspects);
  }, [natalPositions, transitPositions, orb, selectedPlanets, selectedAspects]);

  // Draw the wheel chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading || error) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const S  = canvas.width;
    const cx = S / 2;
    const cy = S / 2;

    // Ring radii (as fraction of canvas size)
    const R_OUTER    = S * 0.46;   // outer edge of zodiac band
    const R_ZODIAC   = S * 0.39;   // inner edge of zodiac band
    const R_TRANSIT  = S * 0.315;  // transit planet positions
    const R_SEP      = S * 0.255;  // divider between transit / natal rings
    const R_NATAL    = S * 0.195;  // natal planet positions
    const R_INNER    = S * 0.14;   // inner void

    // Palette
    const col = {
      bg:         isDark ? '#111111' : '#FAFAFA',
      zodiacEven: isDark ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.025)',
      zodiacOdd:  isDark ? 'rgba(255,255,255,0.018)' : 'rgba(0,0,0,0.010)',
      ring:       isDark ? 'rgba(255,255,255,0.030)' : 'rgba(0,0,0,0.018)',
      border:     isDark ? '#374151' : '#D1D5DB',
      glyph:      isDark ? '#9CA3AF' : '#6B7280',
      natal:      isDark ? '#9CA3AF' : '#6B7280',
      transit:    '#EAB308',        // yellow-400 — transit planets always gold
      transitDim: isDark ? '#4B5563' : '#9CA3AF',
    };

    ctx.clearRect(0, 0, S, S);

    // Outer fill
    ctx.beginPath();
    ctx.arc(cx, cy, R_OUTER, 0, Math.PI * 2);
    ctx.fillStyle = col.bg;
    ctx.fill();

    // --- Zodiac segments ---
    for (let i = 0; i < 12; i++) {
      const a1 = ((i * 30 - 90) * Math.PI) / 180;
      const a2 = (((i + 1) * 30 - 90) * Math.PI) / 180;

      // Segment fill
      ctx.beginPath();
      ctx.arc(cx, cy, R_OUTER, a1, a2);
      ctx.arc(cx, cy, R_ZODIAC, a2, a1, true);
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? col.zodiacEven : col.zodiacOdd;
      ctx.fill();

      // Divider spoke
      const [lx1, ly1] = lonToXY(i * 30, R_OUTER, cx, cy);
      const [lx2, ly2] = lonToXY(i * 30, R_ZODIAC, cx, cy);
      ctx.beginPath();
      ctx.moveTo(lx1, ly1);
      ctx.lineTo(lx2, ly2);
      ctx.strokeStyle = col.border;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Zodiac glyph
      const [gx, gy] = lonToXY(i * 30 + 15, (R_OUTER + R_ZODIAC) / 2, cx, cy);
      ctx.font = `${S * 0.037}px serif`;
      ctx.fillStyle = col.glyph;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ZODIAC[i], gx, gy);
    }

    // Zodiac band borders
    for (const r of [R_OUTER, R_ZODIAC]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = col.border;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Transit ring fill
    ctx.beginPath();
    ctx.arc(cx, cy, R_ZODIAC, 0, Math.PI * 2);
    ctx.fillStyle = col.ring;
    ctx.fill();

    // Separator ring
    ctx.beginPath();
    ctx.arc(cx, cy, R_SEP, 0, Math.PI * 2);
    ctx.strokeStyle = col.border;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Inner circle
    ctx.beginPath();
    ctx.arc(cx, cy, R_INNER, 0, Math.PI * 2);
    ctx.strokeStyle = col.border;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // --- Aspect lines ---
    for (const asp of activeAspects) {
      const [tx, ty] = lonToXY(asp.transitLon, R_TRANSIT, cx, cy);
      const [nx, ny] = lonToXY(asp.natalLon,   R_NATAL,   cx, cy);
      const alpha = Math.max(0.25, 0.85 - asp.orb * 0.15);
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = asp.aspectColor;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = Math.max(0.5, 1.8 - asp.orb * 0.3);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // --- Transit planet symbols ---
    for (const planet of ALL_PLANETS) {
      const lon = transitPositions[planet];
      if (lon === undefined) continue;
      const active = selectedPlanets.has(planet);
      const [px, py] = lonToXY(lon, R_TRANSIT, cx, cy);

      // Tick from zodiac inner ring inward
      const [t1x, t1y] = lonToXY(lon, R_ZODIAC, cx, cy);
      const [t2x, t2y] = lonToXY(lon, R_ZODIAC - S * 0.022, cx, cy);
      ctx.beginPath();
      ctx.moveTo(t1x, t1y);
      ctx.lineTo(t2x, t2y);
      ctx.strokeStyle = active ? col.transit : col.transitDim;
      ctx.lineWidth = active ? 1.5 : 0.8;
      ctx.stroke();

      // Glyph
      ctx.font = `${S * 0.038}px serif`;
      ctx.fillStyle = active ? col.transit : col.transitDim;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(astrologySymbols[planet] ?? planet[0], px, py);
    }

    // --- Natal planet symbols ---
    for (const planet of ALL_PLANETS) {
      const lon = natalPositions[planet];
      if (lon === undefined) continue;
      const [px, py] = lonToXY(lon, R_NATAL, cx, cy);

      // Tick
      const [t1x, t1y] = lonToXY(lon, R_SEP, cx, cy);
      const [t2x, t2y] = lonToXY(lon, R_SEP - S * 0.016, cx, cy);
      ctx.beginPath();
      ctx.moveTo(t1x, t1y);
      ctx.lineTo(t2x, t2y);
      ctx.strokeStyle = col.natal;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Glyph (slightly smaller, muted)
      ctx.font = `${S * 0.033}px serif`;
      ctx.fillStyle = col.natal;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(astrologySymbols[planet] ?? planet[0], px, py);
    }

    // Ring labels
    ctx.font = `${S * 0.022}px sans-serif`;
    ctx.fillStyle = isDark ? '#4B5563' : '#9CA3AF';
    ctx.textAlign = 'center';
    ctx.fillText('TRANSITS', cx, cy - R_TRANSIT - S * 0.005);
    ctx.fillText('NATAL', cx, cy - R_NATAL - S * 0.012);

  }, [loading, error, isDark, natalPositions, transitPositions, activeAspects, selectedPlanets]);

  const openModal = async (asp: ActiveAspect) => {
    setModalAspect(asp);
    setShowModal(true);
    setInterpretationLoading(true);
    setInterpretation('');

    // Build 200-day arc chart (natal lon is fixed)
    const aspAngle = ASPECTS.find(a => a.name === asp.aspectName)?.angle ?? 0;
    const labels: string[] = [];
    const data: number[] = [];
    for (let i = -100; i <= 100; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      try {
        const vec = Astronomy.GeoVector(asp.transitPlanet as any, date, false);
        const tLon = Astronomy.Ecliptic(vec).elon;
        let diff = Math.abs(tLon - asp.natalLon);
        diff = Math.min(diff, 360 - diff);
        if (Math.abs(diff - aspAngle) <= 15) {
          data.push(parseFloat(diff.toFixed(2)));
          labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
      } catch { /* skip */ }
    }
    setModalChartData({ labels, data });

    try {
      const transitInfo = `Transit ${asp.transitPlanet} is in ${asp.aspectName} with natal ${asp.natalPlanet}, with a ${asp.orb.toFixed(1)}° orb`;
      const res = await fetch('/api/astrology/interpretations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transitInfo }),
      });
      const json = await res.json();
      setInterpretation(json.interpretation);
    } catch {
      setInterpretation('Error loading interpretation.');
    } finally {
      setInterpretationLoading(false);
    }
  };

  const togglePlanet = (planet: string) =>
    setSelectedPlanets(prev => {
      const next = new Set(prev);
      next.has(planet) ? next.delete(planet) : next.add(planet);
      return next;
    });

  const toggleAspect = (aspect: string) =>
    setSelectedAspects(prev => {
      const next = new Set(prev);
      next.has(aspect) ? next.delete(aspect) : next.add(aspect);
      return next;
    });

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Transit Chart</h1>
        {birthLabel && (
          <p className="text-xs text-gray-400 mt-1">Natal: {birthLabel}</p>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96 text-gray-400 text-sm">
          Loading birth chart…
        </div>
      ) : !isLoggedIn ? (
        <MemberGate redirect="/astrology/transits/wheel" message="Sign in or create an account to view your personal transit chart." />
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <p className="text-gray-400 text-sm text-center max-w-xs">{error}</p>
          <a
            href="/astrology/personal-reading"
            className="px-4 py-2 bg-yellow-700 text-white rounded-lg text-sm hover:bg-yellow-800 transition-colors"
          >
            Get a Personal Reading
          </a>
        </div>
      ) : (
        <>
          {/* ── Controls ── */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-5 space-y-4">

            {/* Orb */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 w-20 shrink-0">
                Orb
              </span>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={orb}
                onChange={e => setOrb(parseFloat(e.target.value))}
                className="flex-1 accent-yellow-600"
              />
              <span className="text-sm font-mono text-gray-700 dark:text-gray-300 w-12 text-right tabular-nums">
                {orb.toFixed(1)}°
              </span>
            </div>

            {/* Planet selector */}
            <div className="flex items-start gap-4">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 w-20 shrink-0 pt-1">
                Planets
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ALL_PLANETS.map(planet => (
                  <button
                    key={planet}
                    onClick={() => togglePlanet(planet)}
                    title={planet}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors border ${
                      selectedPlanets.has(planet)
                        ? 'bg-yellow-50 dark:bg-yellow-900/25 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400'
                        : 'bg-gray-100 dark:bg-gray-700 border-transparent text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <span className="astrology-symbol text-lg leading-none">
                      {astrologySymbols[planet]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect selector */}
            <div className="flex items-start gap-4">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 w-20 shrink-0 pt-1">
                Aspects
              </span>
              <div className="flex flex-wrap gap-2">
                {ASPECTS.map(asp => (
                  <button
                    key={asp.name}
                    onClick={() => toggleAspect(asp.name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                      selectedAspects.has(asp.name)
                        ? 'text-white border-transparent'
                        : 'bg-gray-100 dark:bg-gray-700 border-transparent text-gray-400 dark:text-gray-500'
                    }`}
                    style={
                      selectedAspects.has(asp.name)
                        ? { backgroundColor: asp.color }
                        : undefined
                    }
                  >
                    <span className="astrology-symbol text-base leading-none">
                      {astrologySymbols[asp.name]}
                    </span>
                    {asp.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Chart ── */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="aspect-square w-full max-w-2xl mx-auto">
              <canvas
                ref={canvasRef}
                width={700}
                height={700}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* ── Active aspects list ── */}
          {activeAspects.length > 0 && (
            <div className="mt-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
                Active Aspects ({activeAspects.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
                {activeAspects.map((asp, i) => (
                  <button
                    key={i}
                    onClick={() => openModal(asp)}
                    className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left w-full"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: asp.aspectColor }}
                    />
                    <span className="astrology-symbol text-yellow-600 dark:text-yellow-400 text-base">
                      {astrologySymbols[asp.transitPlanet]}
                    </span>
                    <span
                      className="astrology-symbol text-base"
                      style={{ color: asp.aspectColor }}
                    >
                      {astrologySymbols[asp.aspectName]}
                    </span>
                    <span className="astrology-symbol text-gray-500 dark:text-gray-400 text-base">
                      {astrologySymbols[asp.natalPlanet]}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300">
                      {asp.transitPlanet}{' '}
                      <span style={{ color: asp.aspectColor }}>{asp.aspectName.toLowerCase()}</span>{' '}
                      {asp.natalPlanet}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto tabular-nums shrink-0">
                      {asp.orb.toFixed(1)}°
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeAspects.length === 0 && (
            <p className="mt-5 text-center text-sm text-gray-400">
              No aspects within {orb.toFixed(1)}° orb for the selected filters.
            </p>
          )}
        </>
      )}
      {/* ── Modal ── */}
      {showModal && modalAspect && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="astrology-symbol text-yellow-600 dark:text-yellow-400 text-2xl">
                  {astrologySymbols[modalAspect.transitPlanet]}
                </span>
                <span className="astrology-symbol text-xl" style={{ color: modalAspect.aspectColor }}>
                  {astrologySymbols[modalAspect.aspectName]}
                </span>
                <span className="astrology-symbol text-gray-500 dark:text-gray-400 text-2xl">
                  {astrologySymbols[modalAspect.natalPlanet]}
                </span>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 ml-1">
                  {modalAspect.transitPlanet}{' '}
                  <span style={{ color: modalAspect.aspectColor }}>{modalAspect.aspectName.toLowerCase()}</span>{' '}
                  {modalAspect.natalPlanet}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-5">
              Orb: {modalAspect.orb.toFixed(1)}°
            </p>

            {/* Interpretation */}
            <div className="mb-5">
              <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                Archetypal Interpretation
              </h3>
              <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {interpretationLoading ? (
                  <p className="text-gray-400">Loading interpretation…</p>
                ) : (
                  <p>{interpretation}</p>
                )}
              </div>
            </div>

            {/* Line chart */}
            <div className="mb-4">
              <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                Aspect Arc (±100 days)
              </h3>
              <div className="h-48">
                {modalChartData.data.length > 0 ? (
                  <Line
                    data={{
                      labels: modalChartData.labels,
                      datasets: [{
                        label: `${modalAspect.transitPlanet}–${modalAspect.natalPlanet}`,
                        data: modalChartData.data,
                        borderColor: modalAspect.aspectColor,
                        backgroundColor: modalAspect.aspectColor + '33',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { ticks: { maxTicksLimit: 6, color: isDark ? '#6B7280' : '#9CA3AF' }, grid: { display: false } },
                        y: {
                          beginAtZero: false,
                          min: Math.min(...modalChartData.data) - 2,
                          max: Math.max(...modalChartData.data) + 2,
                          ticks: { color: isDark ? '#6B7280' : '#9CA3AF' },
                          grid: { color: isDark ? '#374151' : '#F3F4F6' },
                        },
                      },
                    }}
                  />
                ) : (
                  <p className="text-sm text-gray-400 text-center pt-16">No data in range.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
