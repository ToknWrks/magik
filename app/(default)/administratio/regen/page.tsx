'use client';

import { useState, useEffect } from 'react';
import { formatCo2 } from '@/lib/regen-footprint';

interface RegenStats {
  totals: { total_readings: string; total_co2_grams: string; total_contribution_cents: string };
  unretired: { reading_count: string; co2_grams: string; contribution_cents: string };
  retirements: Retirement[];
  recentReadings: RecentReading[];
}

interface Retirement {
  id: string;
  retired_at: string;
  reading_count: number;
  co2_grams: string;
  contribution_cents: number;
  tx_hash: string | null;
  credit_class: string | null;
  notes: string | null;
}

interface RecentReading {
  id: string;
  created_at: string;
  reading_type: string;
  co2_grams: string | null;
  regen_contribution_cents: number | null;
  regen_retirement_id: string | null;
}

export default function RegenAdminPage() {
  const [stats, setStats] = useState<RegenStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRetireForm, setShowRetireForm] = useState(false);
  const [retiring, setRetiring] = useState(false);
  const [retireForm, setRetireForm] = useState({ tx_hash: '', credit_class: 'C02', notes: '' });
  const [retireError, setRetireError] = useState('');
  const [retireSuccess, setRetireSuccess] = useState('');

  const load = () => {
    setLoading(true);
    fetch('/api/astrology/regen', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); } else { setStats(data); }
        setLoading(false);
      })
      .catch(() => { setError('Failed to load'); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleRetire = async (e: React.FormEvent) => {
    e.preventDefault();
    setRetiring(true);
    setRetireError('');
    setRetireSuccess('');
    try {
      const res = await fetch('/api/astrology/regen', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(retireForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setRetireSuccess(`Recorded retirement of ${data.readingCount} readings. Batch ID: ${data.retirement.id}`);
      setShowRetireForm(false);
      setRetireForm({ tx_hash: '', credit_class: 'C02', notes: '' });
      load();
    } catch (e) {
      setRetireError(e instanceof Error ? e.message : 'Error');
    } finally {
      setRetiring(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!stats) return null;

  const { totals, unretired, retirements, recentReadings } = stats;
  const unretiredCents = parseInt(unretired.contribution_cents) || 0;
  const totalCents = parseInt(totals.total_contribution_cents) || 0;
  const retiredCents = totalCents - unretiredCents;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Regen Network Impact</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ecological contribution tracking — we use ~$0.01, we give back $0.25 (25x)</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Readings', value: totals.total_readings },
          { label: 'Total CO₂ Generated', value: `~${formatCo2(parseFloat(totals.total_co2_grams))}` },
          { label: 'Total Contributed', value: `$${(totalCents / 100).toFixed(2)}` },
          { label: 'Already Retired', value: `$${(retiredCents / 100).toFixed(2)}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Unretired balance */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-green-800 dark:text-green-300">Pending Retirement</p>
            <p className="text-3xl font-bold text-green-700 dark:text-green-400 mt-1">
              ${(unretiredCents / 100).toFixed(2)}
            </p>
            <p className="text-sm text-green-700 dark:text-green-500 mt-1">
              {unretired.reading_count} readings · ~{formatCo2(parseFloat(unretired.co2_grams))} CO₂
            </p>
            <p className="text-xs text-green-600 dark:text-green-500 mt-2">
              Purchase credits via your Regen Compute wallet, then record the retirement below.
            </p>
          </div>
          <button
            onClick={() => setShowRetireForm(v => !v)}
            disabled={parseInt(unretired.reading_count) === 0}
            className="flex-shrink-0 px-4 py-2 bg-green-700 hover:bg-green-800 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Record Retirement
          </button>
        </div>

        {showRetireForm && (
          <form onSubmit={handleRetire} className="mt-5 pt-5 border-t border-green-200 dark:border-green-800 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-green-800 dark:text-green-300 mb-1">Credit Class</label>
                <select
                  value={retireForm.credit_class}
                  onChange={e => setRetireForm(p => ({ ...p, credit_class: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-green-300 dark:border-green-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="C02">C02 — Carbon</option>
                  <option value="C04">C04 — Carbon</option>
                  <option value="C05">C05 — Carbon</option>
                  <option value="BT01">BT01 — Biodiversity (Terrasos)</option>
                  <option value="USS01">USS01 — Umbrella Species</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-green-800 dark:text-green-300 mb-1">Tx Hash (optional)</label>
                <input
                  type="text"
                  value={retireForm.tx_hash}
                  onChange={e => setRetireForm(p => ({ ...p, tx_hash: e.target.value }))}
                  placeholder="regen1..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-green-300 dark:border-green-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-green-800 dark:text-green-300 mb-1">Notes</label>
              <input
                type="text"
                value={retireForm.notes}
                onChange={e => setRetireForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="e.g. Monthly batch via Regen Compute wallet, March 2026"
                className="w-full px-3 py-2 text-sm rounded-lg border border-green-300 dark:border-green-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            {retireError && <p className="text-red-500 text-sm">{retireError}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={retiring}
                className="px-4 py-2 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
              >
                {retiring ? 'Recording...' : `Mark ${unretired.reading_count} Readings as Retired`}
              </button>
              <button type="button" onClick={() => setShowRetireForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                Cancel
              </button>
            </div>
          </form>
        )}

        {retireSuccess && (
          <p className="mt-3 text-sm text-green-700 dark:text-green-400 font-medium">{retireSuccess}</p>
        )}
      </div>

      {/* Retirement history */}
      {retirements.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Retirement History</h2>
          <div className="space-y-2">
            {retirements.map(r => (
              <div key={r.id} className="flex items-start justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {r.reading_count} readings · ~{formatCo2(parseFloat(r.co2_grams))} CO₂ · ${(r.contribution_cents / 100).toFixed(2)}
                    {r.credit_class && <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">{r.credit_class}</span>}
                  </p>
                  {r.tx_hash && (
                    <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-sm">{r.tx_hash}</p>
                  )}
                  {r.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{r.notes}</p>}
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-4">
                  {new Date(r.retired_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent readings */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Recent Readings</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">CO₂</th>
                <th className="pb-2 pr-4">Contribution</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentReadings.map(r => (
                <tr key={r.id}>
                  <td className="py-2 pr-4 text-gray-600 dark:text-gray-400">
                    {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-2 pr-4">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${r.reading_type === 'birthchart' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' : 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'}`}>
                      {r.reading_type === 'birthchart' ? 'Birth Chart' : 'Transit'}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-gray-600 dark:text-gray-400">
                    {r.co2_grams ? `~${formatCo2(parseFloat(r.co2_grams))}` : '—'}
                  </td>
                  <td className="py-2 pr-4 text-gray-600 dark:text-gray-400">
                    {r.regen_contribution_cents ? `$${(r.regen_contribution_cents / 100).toFixed(2)}` : '—'}
                  </td>
                  <td className="py-2">
                    {r.regen_retirement_id
                      ? <span className="text-xs text-green-600 dark:text-green-400 font-medium">retired</span>
                      : <span className="text-xs text-amber-600 dark:text-amber-400">pending</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
