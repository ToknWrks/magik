'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AudioPlayer from '@/components/AudioPlayer';

const VOICES = ['Meditation Female', 'Meditation Male'];

interface Meditation {
  id: string;
  title: string;
  script: string;
  audio_url: string | null;
  voice: string;
  created_at: string;
}

export default function MeditationsPage() {
  const router = useRouter();
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', script: '', voice: 'Meditation Female' });
  const [saving, setSaving] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/meditations', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.meditations) setMeditations(d.meditations); })
      .catch(() => setError('Failed to load meditations'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!form.title.trim() || !form.script.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/meditations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setMeditations(prev => [data.meditation, ...prev]);
      setForm({ title: '', script: '', voice: 'Meditation Female' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const generateAudio = async (med: Meditation) => {
    setGeneratingId(med.id);
    setError('');
    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: med.script,
          contentId: med.id,
          contentType: 'meditation',
          voice: med.voice,
          filename: `meditation-${med.id}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate audio');
      setMeditations(prev => prev.map(m => m.id === med.id ? { ...m, audio_url: data.audioUrl } : m));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error generating audio');
    } finally {
      setGeneratingId(null);
    }
  };

  const deleteMeditation = async (id: string) => {
    if (!confirm('Delete this meditation?')) return;
    await fetch(`/api/admin/meditations/${id}`, { method: 'DELETE', credentials: 'include' });
    setMeditations(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Meditation Builder</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Write a script and generate a guided meditation audio.</p>
      </div>

      {/* Create form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">New Meditation</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Morning Chakra Alignment"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Voice</label>
            <select
              value={form.voice}
              onChange={e => setForm(f => ({ ...f, voice: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {VOICES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Script</label>
              <details className="relative">
                <summary className="text-xs text-amber-600 dark:text-amber-400 cursor-pointer hover:underline list-none">SSML reference ▾</summary>
                <div className="absolute right-0 top-6 z-20 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4 text-xs space-y-3">
                  <p className="font-semibold text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wider">Pause control (not spoken)</p>
                  <div className="space-y-2 text-gray-600 dark:text-gray-400">
                    <div>
                      <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-amber-700 dark:text-amber-400">&lt;break time="5s"/&gt;</code>
                      <p className="mt-0.5">Pause for N seconds — e.g. 3s, 10s, 30s</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <p className="font-semibold text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wider mb-1">Example</p>
                    <pre className="text-[10px] text-gray-500 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">{`Breathe in slowly...\n<break time="4s"/>\nNow release.\n<break time="8s"/>`}</pre>
                  </div>
                </div>
              </details>
            </div>
            <textarea
              value={form.script}
              onChange={e => setForm(f => ({ ...f, script: e.target.value }))}
              rows={10}
              placeholder={`Write the guided meditation script here...\n\nTip: use <break time="5s"/> for pauses.`}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y font-mono"
            />
            <p className="text-xs text-gray-400 mt-1">{form.script.length} characters</p>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={save}
            disabled={saving || !form.title.trim() || !form.script.trim()}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save Meditation'}
          </button>
        </div>
      </div>

      {/* Existing meditations */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Saved Meditations</h2>

        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : meditations.length === 0 ? (
          <p className="text-sm text-gray-400">No meditations yet.</p>
        ) : (
          meditations.map(med => (
            <div key={med.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{med.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Voice: {med.voice} · {med.script.length} chars · {new Date(med.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => generateAudio(med)}
                    disabled={generatingId === med.id}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                  >
                    {generatingId === med.id ? (
                      <>
                        <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        {med.audio_url ? 'Regenerate' : 'Generate Audio'}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => deleteMeditation(med.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M5 7h2v6H5zM9 7h2v6H9zM10 3V2H6v1H2v2h1v9c0 .6.4 1 1 1h8c.6 0 1-.4 1-1V5h1V3h-4zM4 14V5h8v9H4z" />
                    </svg>
                  </button>
                </div>
              </div>

              {med.audio_url && (
                <AudioPlayer url={med.audio_url} label={med.title} />
              )}

              <details className="mt-3">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300">View script</summary>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-wrap leading-relaxed">{med.script}</p>
              </details>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
