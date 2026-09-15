'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Astronomy from 'astronomy-engine';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } from 'chart.js';
import FormattedInterpretation from '@/components/FormattedInterpretation';
import AudioPlayer from '@/components/AudioPlayer';
import { estimateFootprintGrams, formatCo2, REGEN_CONTRIBUTION_CENTS } from '@/lib/regen-footprint';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);


const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const ASPECTS = [
  { name: 'Conjunction', angle: 0 }, { name: 'Sextile', angle: 60 },
  { name: 'Square', angle: 90 }, { name: 'Trine', angle: 120 }, { name: 'Opposition', angle: 180 },
];
const LUMINARIES = new Set(['Sun', 'Moon']);
const NATAL_ASPECT_ORBS = [
  { name: 'Conjunction', angle: 0,   orb: 10, orbLuminary: 15 },
  { name: 'Opposition',  angle: 180, orb: 10, orbLuminary: 15 },
  { name: 'Trine',       angle: 120, orb: 9,  orbLuminary: 12 },
  { name: 'Square',      angle: 90,  orb: 9,  orbLuminary: 12 },
  { name: 'Sextile',     angle: 60,  orb: 5,  orbLuminary: 7  },
];

interface NatalAspect {
  p1: string;
  p2: string;
  aspect: string;
  orb: number;
}

function getPlanetLon(planet: string, date: Date): number {
  return Astronomy.Ecliptic(Astronomy.GeoVector(planet as any, date, false)).elon;
}
function getUnsignedOrb(l1: number, l2: number, a: number): number {
  let d = Math.abs(l1 - l2); d = Math.min(d, 360 - d); return Math.abs(d - a);
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
function findNatalAspects(natal: Record<string, number>): NatalAspect[] {
  const planets = Object.keys(natal);
  const results: NatalAspect[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i], p2 = planets[j];
      let diff = Math.abs(natal[p1] - natal[p2]);
      diff = Math.min(diff, 360 - diff);
      const isLuminary = LUMINARIES.has(p1) || LUMINARIES.has(p2);
      for (const asp of NATAL_ASPECT_ORBS) {
        const maxOrb = isLuminary ? asp.orbLuminary : asp.orb;
        const orb = Math.abs(diff - asp.angle);
        if (orb <= maxOrb) {
          results.push({ p1, p2, aspect: asp.name, orb: parseFloat(orb.toFixed(1)) });
          break;
        }
      }
    }
  }
  return results.sort((a, b) => a.orb - b.orb);
}

function findTransits(natal: Record<string, number>) {
  const today = new Date();
  const tmr = new Date(today.getTime() + 86_400_000);
  const result: { transitPlanet: string; natalPlanet: string; aspect: string; aspectAngle: number; natalLon: number; currentOrb: number; isApplying: boolean }[] = [];
  for (const tp of PLANETS) {
    const lon = getPlanetLon(tp, today);
    for (const [np, nLon] of Object.entries(natal)) {
      for (const asp of ASPECTS) {
        const orb = getUnsignedOrb(lon, nLon, asp.angle);
        if (orb <= 15) {
          const orbTmr = getUnsignedOrb(getPlanetLon(tp, tmr), nLon, asp.angle);
          result.push({ transitPlanet: tp, natalPlanet: np, aspect: asp.name, aspectAngle: asp.angle, natalLon: nLon, currentOrb: parseFloat(orb.toFixed(2)), isApplying: orbTmr < orb });
        }
      }
    }
  }
  return result.sort((a, b) => a.currentOrb - b.currentOrb).slice(0, 6);
}

interface Reading {
  id: string;
  birth_date: string;
  birth_time: string | null;
  birth_location: string;
  focus: string | null;
  report: string;
  reading_type: string | null;
  audio_url: string | null;
  title: string | null;
  co2_grams: number | null;
  regen_contribution_cents: number | null;
  regen_retired_at: string | null;
  created_at: string;
}

function ExpandedReading({ reading }: { reading: Reading }) {
  const [isDark, setIsDark] = useState(false);
  const [selectedTransit, setSelectedTransit] = useState<ReturnType<typeof findTransits>[number] | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [interpretation, setInterpretation] = useState('');
  const [interpretationLoading, setInterpretationLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [reportAudioUrl, setReportAudioUrl] = useState<string | null>(reading.audio_url ?? null);
  const [reportAudioLoading, setReportAudioLoading] = useState(false);
  const [reportAudioError, setReportAudioError] = useState('');
  const [modalChartData, setModalChartData] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const [selectedAspect, setSelectedAspect] = useState<NatalAspect | null>(null);
  const [showAspectModal, setShowAspectModal] = useState(false);
  const [aspectInterpretation, setAspectInterpretation] = useState('');
  const [aspectInterpretationLoading, setAspectInterpretationLoading] = useState(false);

  const isBirthChart = reading.reading_type === 'birthchart';
  const co2Grams = reading.co2_grams != null ? parseFloat(reading.co2_grams as any) : estimateFootprintGrams(reading.report);
  const natal = calcNatal(reading.birth_date, reading.birth_time);
  const transits = isBirthChart ? [] : findTransits(natal);
  const natalAspects = isBirthChart ? findNatalAspects(natal) : [];
  const sections = reading.report.split(/(?=## )/g).filter(Boolean);

  const openAspectModal = async (a: NatalAspect) => {
    setSelectedAspect(a);
    setShowAspectModal(true);
    setAspectInterpretation('');
    setAspectInterpretationLoading(true);
    try {
      const res = await fetch('/api/astrology/interpretations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transitInfo: `Natal ${a.p1} ${a.aspect} Natal ${a.p2} (orb: ${a.orb}°). This is a natal aspect in the birth chart. Use the Archetypal Astrology framework.` }),
      });
      const json = await res.json();
      setAspectInterpretation(json.interpretation || '');
    } catch {
      setAspectInterpretation('Error loading interpretation.');
    } finally {
      setAspectInterpretationLoading(false);
    }
  };

  const openTransitModal = async (t: ReturnType<typeof findTransits>[number]) => {
    setSelectedTransit(t);
    setShowModal(true);
    setInterpretation('');
    setInterpretationLoading(true);
    setAudioUrl(null);
    setAudioError('');

    const labels: string[] = [], data: number[] = [];
    for (let i = -100; i <= 100; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      try {
        const lon1 = getPlanetLon(t.transitPlanet, date);
        let diff = Math.abs(lon1 - t.natalLon);
        diff = Math.min(diff, 360 - diff);
        if (Math.abs(diff - t.aspectAngle) <= 15) {
          data.push(parseFloat(diff.toFixed(2)));
          labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
      } catch { /* skip */ }
    }
    setModalChartData({ labels, data });

    try {
      const transitInfo = `Transit ${t.transitPlanet} ${t.aspect} Natal ${t.natalPlanet} (orb: ${t.currentOrb}°). Use the Archetypal Astrology framework.`;
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

  const textColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  const generateReportAudio = async () => {
    setReportAudioLoading(true);
    setReportAudioError('');
    try {
      const res = await fetch('/api/tts/generate-reading', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: reading.report, readingId: reading.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setReportAudioUrl(data.audioUrl);
    } catch (e) {
      setReportAudioError(e instanceof Error ? e.message : 'Error');
    } finally {
      setReportAudioLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 space-y-4">

      {/* Full reading audio */}
      <div>
        {reportAudioUrl ? (
          <AudioPlayer url={reportAudioUrl} label="Your Full Reading" />
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={generateReportAudio}
              disabled={reportAudioLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50 transition-colors"
            >
              {reportAudioLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
              {reportAudioLoading ? 'Generating audio...' : 'Listen to Full Reading (50 tokens)'}
            </button>
            {reportAudioError && <p className="text-red-500 text-xs">{reportAudioError}</p>}
          </div>
        )}
      </div>

      {sections.map((section, i) => {
        const lines = section.trim().split('\n');
        const heading = lines[0].replace('## ', '');
        const body = lines.slice(1).join('\n').trim();
        return (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">{heading}</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{body}</p>
          </div>
        );
      })}

      {isBirthChart && natalAspects.length > 0 && (
        <div className="pt-2">
          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Architecture of the Soul</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">The fundamental planetary relationships in your birth chart — tap to explore.</p>
          <div className="space-y-2">
            {natalAspects.map((a, i) => (
              <button
                key={i}
                onClick={() => openAspectModal(a)}
                className="w-full flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
              >
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                    {a.p1} {a.aspect} {a.p2}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{a.orb}° orb</p>
                </div>
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {!isBirthChart && transits.length > 0 && (
        <div className="pt-2">
          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Your Personal Transits</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Transiting planets aspecting your natal chart — tap to explore.</p>
          <div className="space-y-2">
            {transits.map((t, ti) => (
              <button
                key={ti}
                onClick={() => openTransitModal(t)}
                className="w-full flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
              >
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                    Transit {t.transitPlanet} {t.aspect} Natal {t.natalPlanet}
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

      {/* ── Ecological Footprint ── */}
      <a
        href="https://compute.regen.network/r/ref_ddb8eb2401844f80"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              ~{formatCo2(co2Grams)} CO₂ used · $0.25 contributed to Regen Network
              {reading.regen_retired_at && (
                <span className="ml-2 text-xs font-normal text-green-600 dark:text-green-400">✓ retired</span>
              )}
            </p>
            <p className="text-xs text-green-700 dark:text-green-500">
              Funds verified ecological regeneration on Regen Network
            </p>
          </div>
        </div>
        <svg className="w-4 h-4 text-green-500 dark:text-green-500 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </a>

      {showAspectModal && selectedAspect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-1 text-gray-900 dark:text-gray-100">
              {selectedAspect.p1} {selectedAspect.aspect} {selectedAspect.p2}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{selectedAspect.orb}° orb · natal aspect</p>
            <div className="mb-4">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Archetypal Interpretation:</h3>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {aspectInterpretationLoading ? (
                  <p className="text-gray-400 italic">Loading interpretation...</p>
                ) : (
                  <FormattedInterpretation text={aspectInterpretation} />
                )}
              </div>
            </div>
            <button
              onClick={() => setShowAspectModal(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm text-gray-700 dark:text-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showModal && selectedTransit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-1 text-gray-900 dark:text-gray-100">
              Transit {selectedTransit.transitPlanet} {selectedTransit.aspect} Natal {selectedTransit.natalPlanet}
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

            {/* Audio reading */}
            {!interpretationLoading && interpretation && (
              <div className="mb-4">
                {audioUrl ? (
                  <AudioPlayer url={audioUrl} label="Audio Reading" />
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={async () => {
                        setAudioLoading(true);
                        setAudioError('');
                        try {
                          const res = await fetch('/api/tts/generate-reading', {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text: interpretation }),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || 'Failed');
                          setAudioUrl(data.audioUrl);
                        } catch (e) {
                          setAudioError(e instanceof Error ? e.message : 'Error');
                        } finally {
                          setAudioLoading(false);
                        }
                      }}
                      disabled={audioLoading}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50 transition-colors"
                    >
                      {audioLoading ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 9.5l-3 3m0 0l3 3m-3-3h7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {audioLoading ? 'Generating audio...' : 'Listen to Reading (50 tokens)'}
                    </button>
                    {audioError && <p className="text-red-500 text-xs">{audioError}</p>}
                  </div>
                )}
              </div>
            )}

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

export default function ReadingsPanel() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');

  const saveTitle = async (id: string) => {
    const trimmed = titleDraft.trim();
    setEditingTitle(null);
    setReadings(prev => prev.map(r => r.id === id ? { ...r, title: trimmed || null } : r));
    await fetch('/api/astrology/readings', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title: trimmed || null }),
    });
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await fetch('/api/astrology/readings', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setReadings(prev => prev.filter(r => r.id !== id));
      setConfirmDelete(null);
      if (expanded === id) setExpanded(null);
    } catch { /* leave UI unchanged */ }
    finally { setDeleting(null); }
  };

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
      reading.title || (reading.reading_type === 'birthchart' ? 'Birth Chart Reading' : 'Personal Transit Reading'),
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
          href="/purchase/readings"
          className="inline-block px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium"
        >
          Purchase a Reading
        </Link>
      </div>
    );
  }

  const totalCo2 = readings.reduce((sum, r) => sum + (r.co2_grams != null ? parseFloat(r.co2_grams as any) : estimateFootprintGrams(r.report)), 0);
  const totalContributionCents = readings.reduce((sum, r) => sum + (r.regen_contribution_cents ?? 0), 0);
  const retiredCount = readings.filter(r => r.regen_retired_at).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">My Astrology Readings</h2>
        <div className="flex items-center gap-2">
          <Link
            href="/astrology/personal-reading"
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium"
          >
            + Personal Transit Reading
          </Link>
          <Link
            href="/astrology/birth-chart-reading"
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium"
          >
            + Birthchart Reading
          </Link>
        </div>
      </div>

      {totalContributionCents > 0 && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 mb-4">
          <svg className="w-8 h-8 text-green-600 dark:text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-800 dark:text-green-300">Your Inner Work Is Regenerating the Earth</p>
            <p className="text-xs text-green-700 dark:text-green-500 mt-0.5">
              {readings.length} reading{readings.length !== 1 ? 's' : ''} · ~{formatCo2(totalCo2)} CO₂ generated · ${(totalContributionCents / 100).toFixed(2)} contributed to Regen Network
              {retiredCount > 0 && ` · ${retiredCount} retired on-chain`}
            </p>
          </div>
        </div>
      )}

      {readings.map(reading => (
        <div
          key={reading.id}
          className="border-t border-x border-gray-200 dark:border-gray-900 rounded-xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800">
            <div className="flex-1 min-w-0 mr-3">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  reading.reading_type === 'birthchart'
                    ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                    : 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                }`}>
                  {reading.reading_type === 'birthchart' ? 'Birth Chart' : 'Transit'}
                </span>
                {editingTitle === reading.id ? (
                  <input
                    autoFocus
                    value={titleDraft}
                    onChange={e => setTitleDraft(e.target.value)}
                    onBlur={() => saveTitle(reading.id)}
                    onKeyDown={e => { if (e.key === 'Enter') saveTitle(reading.id); if (e.key === 'Escape') setEditingTitle(null); }}
                    placeholder={reading.reading_type === 'birthchart' ? 'Birth Chart' : 'Personal Transit'}
                    className="flex-1 text-sm font-medium bg-transparent border-b border-gray-400 dark:border-gray-500 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
                  />
                ) : (
                  <button
                    onClick={() => { setEditingTitle(reading.id); setTitleDraft(reading.title ?? ''); }}
                    className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate"
                    title="Click to edit title"
                  >
                    {reading.title || (reading.reading_type === 'birthchart' ? 'Birth Chart' : 'Personal Transit')}
                    <svg className="inline-block ml-1 w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {reading.birth_location} · {reading.birth_date} · {new Date(reading.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                {reading.focus && ` · "${reading.focus.slice(0, 40)}${reading.focus.length > 40 ? '...' : ''}"`}
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
              {confirmDelete === reading.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDelete(reading.id)}
                    disabled={deleting === reading.id}
                    className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg"
                  >
                    {deleting === reading.id ? '...' : 'Delete'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-2.5 py-1.5 text-gray-500 text-xs font-medium hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(reading.id)}
                  className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
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
