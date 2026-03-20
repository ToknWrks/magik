// app/astrology/transits/astrology-transits.tsx
'use client';

import { useState, useEffect } from 'react';
import * as Astronomy from 'astronomy-engine';
import { astrologySymbols } from '../symbols';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface Transit {
  planet1: string;
  planet2: string;
  aspect: string;
  angle: number;
  orb: number;
  description: string;
}

interface PersonalTransit {
  transitPlanet: string;
  natalPlanet: string;
  aspect: string;
  orb: number;
  isApplying: boolean;
}

const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const ASPECTS = [
  { name: 'Conjunct', angle: 0 },
  { name: 'Sextile', angle: 60 },
  { name: 'Square', angle: 90 },
  { name: 'Trine', angle: 120 },
  { name: 'Opposite', angle: 180 },
];

function getPlanetPositions(date: Date): Record<string, number> {
  const positions: Record<string, number> = {};
  for (const planet of PLANETS) {
    try {
      const pos = Astronomy.GeoVector(planet as any, date, false);
      const ecl = Astronomy.Ecliptic(pos);
      positions[planet] = ecl.elon;
    } catch {
      // skip
    }
  }
  return positions;
}

export default function AstrologyTransits() {
  const [transits, setTransits] = useState<Transit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransit, setSelectedTransit] = useState<Transit | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [claudeInterpretation, setClaudeInterpretation] = useState<string>('');
  const [interpretationLoading, setInterpretationLoading] = useState(false);
  const [chartData, setChartData] = useState<{ labels: string[], data: number[] }>({ labels: [], data: [] });

  const [mineMode, setMineMode] = useState(false);
  const [personalTransits, setPersonalTransits] = useState<PersonalTransit[]>([]);
  const [loadingMine, setLoadingMine] = useState(false);
  const [mineError, setMineError] = useState('');
  const [birthLabel, setBirthLabel] = useState('');

  useEffect(() => {
    calculateTransits();
  }, []);

  const calculateTransits = async () => {
    try {
      const positions = getPlanetPositions(new Date());
      const transitList: Transit[] = [];

      for (let i = 0; i < PLANETS.length; i++) {
        for (let j = i + 1; j < PLANETS.length; j++) {
          const lon1 = positions[PLANETS[i]];
          const lon2 = positions[PLANETS[j]];
          if (lon1 === undefined || lon2 === undefined) continue;
          let diff = Math.abs(lon1 - lon2);
          diff = Math.min(diff, 360 - diff);

          for (const asp of ASPECTS) {
            const orb = Math.abs(diff - asp.angle);
            if (orb <= 15) {
              transitList.push({
                planet1: PLANETS[i],
                planet2: PLANETS[j],
                aspect: asp.name,
                angle: diff,
                orb,
                description: `The ${PLANETS[i]} is ${asp.name} ${PLANETS[j]}, creating a ${diff.toFixed(1)}° angle with ${orb.toFixed(1)}° orb.`,
              });
            }
          }
        }
      }

      setTransits(transitList);
      setLoading(false);
    } catch (error) {
      console.error('Error calculating transits:', error);
      setLoading(false);
    }
  };

  const handleMineToggle = async () => {
    if (mineMode) {
      setMineMode(false);
      return;
    }

    setLoadingMine(true);
    setMineError('');
    try {
      const res = await fetch('/api/astrology/readings', { credentials: 'include' });
      if (res.status === 401) {
        setMineError('Sign in and get a personal reading to see your transits.');
        setMineMode(true);
        return;
      }
      const data = await res.json();
      if (!data.readings?.length) {
        setMineError('No readings found. Get a personal reading first to see your natal transits.');
        setMineMode(true);
        return;
      }

      const reading = data.readings[0];
      const birthDate = new Date(reading.birth_date);
      if (reading.birth_time) {
        const [h, m] = reading.birth_time.split(':').map(Number);
        if (!isNaN(h)) birthDate.setHours(h, m || 0, 0, 0);
      }

      setBirthLabel(`${reading.birth_date}${reading.birth_time ? ' ' + reading.birth_time : ''} · ${reading.birth_location}`);

      const natalPositions = getPlanetPositions(birthDate);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const transitToday = getPlanetPositions(today);
      const transitTomorrow = getPlanetPositions(tomorrow);

      const results: PersonalTransit[] = [];
      for (const tPlanet of PLANETS) {
        for (const nPlanet of PLANETS) {
          const tLon = transitToday[tPlanet];
          const nLon = natalPositions[nPlanet];
          if (tLon === undefined || nLon === undefined) continue;

          let diff = Math.abs(tLon - nLon);
          diff = Math.min(diff, 360 - diff);

          for (const asp of ASPECTS) {
            const orb = Math.abs(diff - asp.angle);
            if (orb <= 15) {
              // Check applying vs separating
              const tLonTmrw = transitTomorrow[tPlanet] ?? tLon;
              let diffTmrw = Math.abs(tLonTmrw - nLon);
              diffTmrw = Math.min(diffTmrw, 360 - diffTmrw);
              const orbTmrw = Math.abs(diffTmrw - asp.angle);
              results.push({
                transitPlanet: tPlanet,
                natalPlanet: nPlanet,
                aspect: asp.name,
                orb,
                isApplying: orbTmrw < orb,
              });
            }
          }
        }
      }

      results.sort((a, b) => a.orb - b.orb);
      setPersonalTransits(results);
      setMineMode(true);
    } catch {
      setMineError('Failed to load your birth data.');
      setMineMode(true);
    } finally {
      setLoadingMine(false);
    }
  };

  const openModal = async (transit: Transit) => {
    setSelectedTransit(transit);
    setShowModal(true);
    setInterpretationLoading(true);
    
    // Calculate chart data
  const chartData = [];
  const labels = [];
  const days = 200; // 200 days range to find aspect period
  const step = 1; // every day
  const aspectAngle = transit.angle; // The exact aspect angle
  
  for (let i = -days/2; i <= days/2; i += step) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    const pos1 = Astronomy.GeoVector(transit.planet1 as any, date, false);
    const pos2 = Astronomy.GeoVector(transit.planet2 as any, date, false);
    const ecl1 = Astronomy.Ecliptic(pos1);
    const ecl2 = Astronomy.Ecliptic(pos2);
    
    let diff = Math.abs(ecl1.elon - ecl2.elon);
    diff = Math.min(diff, 360 - diff);
    
    // Only include points within 5 degrees of the aspect angle
    if (Math.abs(diff - aspectAngle) <= 5) {
      chartData.push(diff);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
  }
    
    setChartData({ labels, data: chartData });
    
    try {
      const transitInfo = `The ${transit.planet1} is in ${transit.aspect} with ${transit.planet2}, creating a ${transit.angle.toFixed(1)}° angle with ${transit.orb.toFixed(1)}° orb`;
      const response = await fetch('/api/astrology/interpretations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transitInfo }),
      });
      const data = await response.json();
      setClaudeInterpretation(data.interpretation);
    } catch (error) {
      setClaudeInterpretation('Error loading interpretation.');
    } finally {
      setInterpretationLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {mineMode ? 'Your Personal Transits' : 'Current World Transits'}
          </h1>
          {mineMode && birthLabel && (
            <p className="text-xs text-gray-400 mt-1">Natal chart: {birthLabel}</p>
          )}
        </div>
        <button
          onClick={handleMineToggle}
          disabled={loadingMine}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
            mineMode
              ? 'bg-yellow-700 text-white hover:bg-yellow-800'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {loadingMine ? '...' : mineMode ? 'World' : 'Mine'}
        </button>
      </div>

      {mineMode ? (
        mineError ? (
          <div className="text-center py-16 text-gray-400 text-sm">{mineError}</div>
        ) : personalTransits.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No active personal transits found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personalTransits.map((t, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">
                    {t.transitPlanet} {t.aspect} natal {t.natalPlanet}
                  </h3>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    t.isApplying
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    {t.isApplying ? 'applying' : 'separating'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Orb: {t.orb.toFixed(1)}°
                </p>
                <div className="flex gap-2 text-2xl astrology-symbol">
                  <span>{astrologySymbols[t.transitPlanet]}</span>
                  <span className="text-xl">{astrologySymbols[t.aspect]}</span>
                  <span>{astrologySymbols[t.natalPlanet]}</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : loading ? (
        <div>Loading transits...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {transits.map((transit, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {transit.planet1} {transit.aspect} {transit.planet2}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {transit.description}
                  </p>
                  <div className="text-sm text-gray-500">
                    {transit.angle.toFixed(1)}° • Orb: {transit.orb.toFixed(1)}°
                  </div>
                </div>
                <button
                  onClick={() => openModal(transit)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
              <div className="flex justify-end gap-2">
                <span className="text-2xl astrology-symbol">
                  {astrologySymbols[transit.planet1]}
                </span>
                <span className="text-xl astrology-symbol">
                  {astrologySymbols[transit.aspect]}
                </span>
                <span className="text-2xl astrology-symbol">
                  {astrologySymbols[transit.planet2]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && selectedTransit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {selectedTransit.planet1} {selectedTransit.aspect} {selectedTransit.planet2}
            </h2>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {selectedTransit.description}
            </p>
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Archetypal Interpretation:</h3>
              <div className="max-h-40 overflow-y-auto text-sm">
                {interpretationLoading ? (
                  <p>Loading interpretation...</p>
                ) : (
                  <p>{claudeInterpretation}</p>
                )}
              </div>
            </div>
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Aspect Chart:</h3>
              <div className="h-48">
                <Line
                  data={{
                    labels: chartData.labels,
                    datasets: [{
                      label: `${selectedTransit.planet1}-${selectedTransit.planet2} Aspect`,
                      data: chartData.data,
                      borderColor: 'rgba(75, 192, 192, 1)',
                      backgroundColor: 'rgba(75, 192, 192, 0.2)',
                      tension: 0.4,
                      fill: false,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { 
                      y: { 
                        beginAtZero: false,
                        min: Math.min(...chartData.data) - 5,
                        max: Math.max(...chartData.data) + 5,
                      } 
                    },
                  }}
                />
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
              <span>Angle: {selectedTransit.angle.toFixed(1)}°</span>
              <span>Orb: {selectedTransit.orb.toFixed(1)}°</span>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}