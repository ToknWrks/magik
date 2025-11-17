// app/astrology/astrology-chart.tsx
'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import * as Astronomy from 'astronomy-engine';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface AspectData {
  date: string;
  aspect: number;
}

export default function AstrologyChart() {
  const [aspectData, setAspectData] = useState<AspectData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAspectOverTime();
  }, []);

  const fetchAspectOverTime = async () => {
    try {
      const data: AspectData[] = [];
      // Base date around Saturn-Jupiter conjunction (2020-12-21)
      const baseDate = new Date('2020-12-21');
      for (let i = -30; i <= 30; i += 0.5) {  // Calculate every 0.5 days for smoother curve
        const date = new Date(baseDate);
        date.setDate(baseDate.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        // Calculate positions using astronomy-engine
        const saturnPos = Astronomy.GeoVector(Astronomy.Body.Saturn, date, false);
        const jupiterPos = Astronomy.GeoVector(Astronomy.Body.Jupiter, date, false);

        // Get ecliptic longitude (zodiac position)
        const saturnEcl = Astronomy.Ecliptic(saturnPos);
        const jupiterEcl = Astronomy.Ecliptic(jupiterPos);

        const saturnLon = saturnEcl.elon; // Degrees
        const jupiterLon = jupiterEcl.elon;

        let aspect = Math.abs(saturnLon - jupiterLon);
        aspect = Math.min(aspect, 360 - aspect); // Shortest arc

        // Only include data points where aspect <= 15°
        if (aspect <= 15) {
          const closeness = 20 - aspect; // Optional: keep inverted for visualization
          data.push({ date: dateStr, aspect: closeness });
        }
      }
      setAspectData(data);
    } catch (error) {
      console.error('Error calculating aspects:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: aspectData.map(d => d.date),
    datasets: [
      {
        label: 'Saturn-Jupiter Aspect (°)',
        data: aspectData.map(d => d.aspect),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Saturn-Jupiter Aspect: Within 15° Separation' },
    },
    scales: {
      y: { beginAtZero: true, max: 30 },
    },
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Astrology Chart: Saturn-Jupiter Aspect Over Time</h1>
      <Line data={chartData} options={options} />
      <p className="mt-4">
        This chart shows the period where Saturn and Jupiter are within 15° of each other, highlighting their close approach during the 2020 conjunction.
      </p>
    </div>
  );
}