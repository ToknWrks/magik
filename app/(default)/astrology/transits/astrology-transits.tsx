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

export default function AstrologyTransits() {
  const [transits, setTransits] = useState<Transit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransit, setSelectedTransit] = useState<Transit | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [claudeInterpretation, setClaudeInterpretation] = useState<string>('');
  const [interpretationLoading, setInterpretationLoading] = useState(false);
  const [chartData, setChartData] = useState<{ labels: string[], data: number[] }>({ labels: [], data: [] });

  useEffect(() => {
    calculateTransits();
  }, []);

  const calculateTransits = async () => {
    try {
      const planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
      const aspects = [
        { name: 'Conjunction', angle: 0 },
        { name: 'Sextile', angle: 60 },
        { name: 'Square', angle: 90 },
        { name: 'Trine', angle: 120 },
        { name: 'Opposition', angle: 180 },
      ];

      const positions: { [key: string]: number } = {};
      const date = new Date();

      // Calculate positions
      for (const planet of planets) {
        const pos = Astronomy.GeoVector(planet as any, date, false);
        const ecl = Astronomy.Ecliptic(pos);
        positions[planet] = ecl.elon;
      }

      const transitList: Transit[] = [];

      // Check pairwise aspects
      for (let i = 0; i < planets.length; i++) {
        for (let j = i + 1; j < planets.length; j++) {
          const lon1 = positions[planets[i]];
          const lon2 = positions[planets[j]];
          let diff = Math.abs(lon1 - lon2);
          diff = Math.min(diff, 360 - diff);

          for (const asp of aspects) {
            const orb = Math.abs(diff - asp.angle);
            if (orb <= 5) { // 5 degree orb
              transitList.push({
                planet1: planets[i],
                planet2: planets[j],
                aspect: asp.name,
                angle: diff,
                orb: orb,
                description: `The ${planets[i]} is in ${asp.name} aspect with ${planets[j]}, creating a ${diff.toFixed(1)}° angle with ${orb.toFixed(1)}° orb.`,
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
      const transitInfo = `The ${transit.planet1} is in ${transit.aspect} aspect with ${transit.planet2}, creating a ${transit.angle.toFixed(1)}° angle with ${transit.orb.toFixed(1)}° orb`;
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
      <h1 className="text-2xl font-bold mb-6">Current Astrological World Transits</h1>
      
      {loading ? (
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