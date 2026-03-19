'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Astronomy from 'astronomy-engine';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const ASPECTS = [
  { name: 'Conjunction', angle: 0 }, { name: 'Sextile', angle: 60 },
  { name: 'Square', angle: 90 }, { name: 'Trine', angle: 120 }, { name: 'Opposition', angle: 180 },
];

function getPlanetLon(planet: string, date: Date): number {
  return Astronomy.Ecliptic(Astronomy.GeoVector(planet as any, date, false)).elon;
}
function getUnsignedOrb(l1: number, l2: number, a: number): number {
  let d = Math.abs(l1 - l2); d = Math.min(d, 360 - d); return Math.abs(d - a);
}
function getSignedOrb(p: string, nLon: number, angle: number, date: Date): number {
  const orb = getUnsignedOrb(getPlanetLon(p, date), nLon, angle);
  const tmr = new Date(date.getTime() + 86_400_000);
  const orbTmr = getUnsignedOrb(getPlanetLon(p, tmr), nLon, angle);
  return orbTmr < orb ? -orb : orb;
}
function calcNatal(birthDate: string, birthTime?: string | null): Record<string, number> {
  const [y, m, d] = birthDate.split('-').map(Number);
  let h = 12, min = 0;
  if (birthTime) [h, min] = birthTime.split(':').map(Number);
  const dt = new Date(y, m - 1, d, h, min);
  const pos: Record<string, number> = {};
  for (const p of PLANETS) { try { pos[p] = getPlanetLon(p, dt); } catch { /**/ } }
  return pos;
}
function findTransits(natal: Record<string, number>) {
  const today = new Date();
  const tmr = new Date(today.getTime() + 86_400_000);
  const result: { transitPlanet: string; natalPlanet: string; aspect: string; aspectAngle: number; natalLon: number }[] = [];
  for (const tp of PLANETS) {
    const lon = getPlanetLon(tp, today);
    for (const [np, nLon] of Object.entries(natal)) {
      for (const asp of ASPECTS) {
        const orb = getUnsignedOrb(lon, nLon, asp.angle);
        if (orb <= 15) result.push({ transitPlanet: tp, natalPlanet: np, aspect: asp.name, aspectAngle: asp.angle, natalLon: nLon });
      }
    }
  }
  return result.sort((a, b) => getUnsignedOrb(getPlanetLon(a.transitPlanet, today), a.natalLon, a.aspectAngle) - getUnsignedOrb(getPlanetLon(b.transitPlanet, today), b.natalLon, b.aspectAngle)).slice(0, 6);
}
function genChartData(tp: string, nLon: number, angle: number) {
  const labels: string[] = [], data: (number | null)[] = [];
  const today = new Date();
  for (let i = -30; i <= 30; i++) {
    const dt = new Date(today.getTime() + i * 86_400_000);
    labels.push(dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    try {
      const s = getSignedOrb(tp, nLon, angle, dt);
      data.push(Math.abs(s) <= 15 ? parseFloat((-Math.abs(s)).toFixed(2)) : null);
    } catch { data.push(null); }
  }
  return { labels, data };
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
function findDates(tp: string, nLon: number, angle: number) {
  const today = new Date();
  let entryDate: Date | null = null;
  for (let i = 0; i >= -365; i--) {
    const d = new Date(today.getTime() + i * 86_400_000);
    try { if (getUnsignedOrb(getPlanetLon(tp, d), nLon, angle) > 15) { entryDate = new Date(today.getTime() + (i + 1) * 86_400_000); break; } } catch { break; }
  }
  let exitDate: Date | null = null;
  for (let i = 0; i <= 365; i++) {
    const d = new Date(today.getTime() + i * 86_400_000);
    try { if (getUnsignedOrb(getPlanetLon(tp, d), nLon, angle) > 15) { exitDate = new Date(today.getTime() + (i - 1) * 86_400_000); break; } } catch { break; }
  }
  let exactDate: Date | null = null; let minOrb = Infinity;
  const s = entryDate ? Math.round((entryDate.getTime() - today.getTime()) / 86_400_000) : -30;
  const e = exitDate ? Math.round((exitDate.getTime() - today.getTime()) / 86_400_000) : 30;
  for (let i = s; i <= e; i++) {
    const d = new Date(today.getTime() + i * 86_400_000);
    try { const orb = getUnsignedOrb(getPlanetLon(tp, d), nLon, angle); if (orb < minOrb) { minOrb = orb; exactDate = d; } } catch { /**/ }
  }
  return { entryDate, exactDate, exitDate };
}
function buildDesc(tp: string, np: string, aspect: string, entry: Date | null, exact: Date | null, exit: Date | null): string {
  const today = new Date();
  let desc = entry
    ? (entry <= today ? `This transit entered orb on ${fmtDate(entry)}` : `This transit will begin to make itself felt when it enters orb on ${fmtDate(entry)}`)
    : 'This transit has been active for an extended period';
  if (exact) desc += exact <= today ? `, was exact on ${fmtDate(exact)} (0°) — its peak intensity` : ` and will be exact on ${fmtDate(exact)} (0°) where it will be most intense`;
  desc += exit ? `, and will diminish in intensity until ${fmtDate(exit)} when it leaves the orb of influence.` : '. This influence is long-lasting and may remain active for an extended period.';
  return desc;
}

function MiniTransitChart({ tp, np, aspect, angle, nLon, isDark }: { tp: string; np: string; aspect: string; angle: number; nLon: number; isDark: boolean }) {
  const { labels, data } = genChartData(tp, nLon, angle);
  if (!data.some(d => d !== null)) return null;
  const { entryDate, exactDate, exitDate } = findDates(tp, nLon, angle);
  const description = buildDesc(tp, np, aspect, entryDate, exactDate, exitDate);
  const c = isDark ? '#9ca3af' : '#6b7280';
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Transit {tp} {aspect} Natal {np}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">{description}</p>
      <div className="h-24">
        <Line
          data={{ labels, datasets: [{ data, borderColor: 'rgb(99,102,241)', borderWidth: 1.5, pointRadius: 0, tension: 0.4, fill: false, spanGaps: false }] }}
          options={{
            responsive: true, maintainAspectRatio: false, animation: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${(ctx.parsed.y as number).toFixed(1)}°` } } },
            scales: {
              x: { ticks: { maxTicksLimit: 6, maxRotation: 0, color: c, font: { size: 9 } }, grid: { display: false } },
              y: { min: -16, max: 0, ticks: { stepSize: 5, color: c, font: { size: 9 }, callback: (v) => `${Math.abs(v as number)}°` }, grid: { color: (ctx) => ctx.tick.value === 0 ? 'rgba(99,102,241,0.5)' : 'rgba(156,163,175,0.1)', lineWidth: (ctx) => ctx.tick.value === 0 ? 2 : 1 } },
            },
          }}
        />
      </div>
    </div>
  );
}

interface Reading {
  id: string;
  birth_date: string;
  birth_time: string | null;
  birth_location: string;
  focus: string | null;
  report: string;
  created_at: string;
}

function ExpandedReading({ reading }: { reading: Reading }) {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const natal = calcNatal(reading.birth_date, reading.birth_time);
  const transits = findTransits(natal);
  const sections = reading.report.split(/(?=## )/g).filter(Boolean);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900 space-y-4">
      {sections.map((section, i) => {
        const lines = section.trim().split('\n');
        const heading = lines[0].replace('## ', '');
        const body = lines.slice(1).join('\n').trim();
        return (
          <div key={i}>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{heading}</h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">{body}</p>
          </div>
        );
      })}

      {transits.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
          <p className="font-semibold text-gray-900 dark:text-gray-100">Your Personal Transit Charts</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Transiting planets aspecting your natal chart, within 15° orb.</p>
          {transits.map((t, ti) => (
            <MiniTransitChart key={ti} tp={t.transitPlanet} np={t.natalPlanet} aspect={t.aspect} angle={t.aspectAngle} nLon={t.natalLon} isDark={isDark} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReadingsPanel() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/astrology/readings', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setReadings(data.readings || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDownload = (reading: Reading) => {
    const content = [
      `Personal Transit Reading`,
      `Date: ${new Date(reading.created_at).toLocaleDateString()}`,
      `Birth Date: ${reading.birth_date}`,
      reading.birth_time ? `Birth Time: ${reading.birth_time}` : null,
      `Birth Location: ${reading.birth_location}`,
      reading.focus ? `Focus: ${reading.focus}` : null,
      '',
      reading.report,
    ].filter(Boolean).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transit-reading-${reading.birth_date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-500 dark:text-gray-400">Loading your readings...</div>;
  }

  if (readings.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-4">You don't have any readings yet.</p>
        <Link
          href="/astrology/personal-reading"
          className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium"
        >
          Get Your First Reading — $9
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">My Astrology Readings</h2>
        <Link
          href="/astrology/personal-reading"
          className="px-4 py-2 bg-yellow-700 hover:bg-yellow-700 text-black rounded-lg text-sm font-medium"
        >
          + New Reading
        </Link>
      </div>

      {readings.map(reading => (
        <div
          key={reading.id}
          className="border border-gray-200 dark:border-gray-900 rounded-xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {reading.birth_location} · {reading.birth_date}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(reading.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                {reading.focus && ` · "${reading.focus.slice(0, 50)}${reading.focus.length > 50 ? '...' : ''}"`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownload(reading)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                title="Download"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              <button
                onClick={() => setExpanded(expanded === reading.id ? null : reading.id)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                title={expanded === reading.id ? 'Collapse' : 'View'}
              >
                <svg
                  className={`w-5 h-5 transition-transform ${expanded === reading.id ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {expanded === reading.id && (
            <ExpandedReading reading={reading} />
          )}
        </div>
      ))}
    </div>
  );
}
