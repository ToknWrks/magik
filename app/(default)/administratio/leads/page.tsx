'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { LEAD_KEYWORDS } from '@/lib/x-leads-constants';

interface Lead {
  id: number;
  twitter_user_id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  followers_count: number;
  relevance_score: number;
  relevance_reason: string | null;
  source_tweet_id: string | null;
  source_tweet_text: string | null;
  status: string;
  liked_at: string | null;
  followed_at: string | null;
  replied_at: string | null;
  created_at: string;
}

interface Stats {
  total: string;
  discovered: string;
  liked: string;
  followed: string;
  replied: string;
  avg_score: string;
}

const STATUS_COLORS: Record<string, string> = {
  discovered: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  liked:      'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
  followed:   'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  replied:    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  converted:  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
};

function scoreBadge(score: number) {
  const color =
    score >= 80 ? 'bg-emerald-500' :
    score >= 60 ? 'bg-yellow-500' :
    score >= 40 ? 'bg-orange-400' :
    'bg-gray-400';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-white text-xs font-bold ${color}`}>
      {score}
    </span>
  );
}

interface ReplyPreview {
  leadId: number;
  username: string;
  tweetId: string | null;
  sourceTweet: string | null;
  replyText: string;
}

export default function LeadsPage() {
  const [leads, setLeads]         = useState<Lead[]>([]);
  const [stats, setStats]         = useState<Stats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [searching, setSearching] = useState(false);
  const [engaging, setEngaging]   = useState<number | null>(null);
  const [setupDone, setSetupDone] = useState(false);
  const [setupMsg, setSetupMsg]   = useState('');
  const [searchMsg, setSearchMsg] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [minScore, setMinScore]   = useState(40);
  const [keyword, setKeyword]     = useState('');
  const [maxResults, setMaxResults] = useState(10);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [preview, setPreview]     = useState<ReplyPreview | null>(null);
  const [previewing, setPreviewing] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ min_score: String(minScore) });
      if (filterStatus) params.set('status', filterStatus);
      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads ?? []);
      setStats(data.stats ?? null);
      if (data.error) console.error('Leads API error:', data.error);
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  }, [minScore, filterStatus]);

  useEffect(() => { load(); }, [load]);

  async function setup() {
    const res = await fetch('/api/leads/setup', { method: 'POST' });
    const data = await res.json();
    setSetupMsg(data.message ?? data.error ?? 'Done');
    setSetupDone(true);
  }

  async function runSearch() {
    setSearching(true);
    setSearchMsg('');
    const res = await fetch('/api/leads/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: keyword || undefined, max_results: maxResults, min_score: minScore }),
    });
    const data = await res.json();
    if (data.error) {
      const msg = `Error: ${data.error}`;
      setSearchMsg(msg);
    } else {
      const parts = [`"${data.keyword}" → Grok found ${data.grokFound}, imported ${data.imported}`];
      if (data.duplicates) parts.push(`${data.duplicates} already in DB`);
      if (data.lowScore) parts.push(`${data.lowScore} below min score`);
      setSearchMsg(parts.join(' · '));
      load();
    }
    setSearching(false);
  }

  async function engage(id: number, action: 'like' | 'follow' | 'reply') {
    setEngaging(id);
    const res = await fetch('/api/leads/engage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    const data = await res.json();
    if (data.error) {
      alert(`Error: ${data.error}`);
    }
    setEngaging(null);
    load();
  }

  async function openReplyPreview(lead: Lead) {
    setPreviewing(lead.id);
    const res = await fetch('/api/leads/preview-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lead.id }),
    });
    const data = await res.json();
    if (data.error) {
      alert(`Error: ${data.error}`);
    } else {
      setPreview({ leadId: lead.id, username: lead.username, tweetId: lead.source_tweet_id, sourceTweet: lead.source_tweet_text, replyText: data.replyText });
    }
    setPreviewing(null);
  }

  async function sendReply() {
    if (!preview) return;
    await engage(preview.leadId, 'reply');
    setPreview(null);
  }

  async function deleteLead(id: number) {
    await fetch('/api/leads', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setLeads((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">X Lead Generation</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Find astrology & occult enthusiasts on X. Score with Grok. Engage to grow @illuminati.earth.
      </p>

      {/* Setup */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={setup}
            className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            Setup DB Table
          </button>
          {setupMsg && (
            <span className={`text-xs ${setupDone ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
              {setupMsg}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total',     value: stats.total },
            { label: 'Discovered', value: stats.discovered },
            { label: 'Liked',     value: stats.liked },
            { label: 'Followed',  value: stats.followed },
            { label: 'Replied',   value: stats.replied },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
              <div className="text-xl font-bold text-gray-800 dark:text-gray-100">{s.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Search & Import</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Keyword</label>
            <select
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              <option value="">Random</option>
              {LEAD_KEYWORDS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Max Results</label>
            <select
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Min Score</label>
            <input
              type="number"
              min={0} max={100}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 w-20 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            />
          </div>
          <button
            onClick={runSearch}
            disabled={searching}
            className="px-4 py-1.5 text-sm bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-gray-900 font-medium rounded-lg transition-colors"
          >
            {searching ? 'Searching…' : 'Run Search'}
          </button>
        </div>
        {searchMsg && (
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">{searchMsg}</p>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'discovered', 'liked', 'followed', 'replied'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              filterStatus === s
                ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 border-transparent'
                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Leads Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading…</div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No leads yet. Run a search to import leads.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">User</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hidden sm:table-cell">Followers</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Score</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {leads.map((lead) => (
                <React.Fragment key={lead.id}>
                  <tr
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800 dark:text-gray-200">
                        @{lead.username}
                      </div>
                      {lead.display_name && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{lead.display_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                      {lead.followers_count.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{scoreBadge(lead.relevance_score)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[lead.status] ?? STATUS_COLORS.discovered}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button
                          onClick={() => engage(lead.id, 'like')}
                          disabled={engaging === lead.id || !!lead.liked_at}
                          className="px-2 py-1 text-xs bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 text-pink-600 rounded disabled:opacity-40 transition-colors"
                          title="Like source tweet"
                        >
                          ♥
                        </button>
                        <button
                          onClick={() => engage(lead.id, 'follow')}
                          disabled={engaging === lead.id || !!lead.followed_at}
                          className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 text-blue-600 rounded disabled:opacity-40 transition-colors"
                          title="Follow user"
                        >
                          +
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openReplyPreview(lead); }}
                          disabled={previewing === lead.id || engaging === lead.id || !!lead.replied_at}
                          className="px-2 py-1 text-xs bg-green-50 dark:bg-green-900/20 hover:bg-green-100 text-green-600 rounded disabled:opacity-40 transition-colors"
                          title="Preview & send AI reply"
                        >
                          {previewing === lead.id ? '…' : '↩'}
                        </button>
                        <a
                          href={`https://x.com/${lead.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 text-xs bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 text-gray-600 dark:text-gray-400 rounded transition-colors"
                          title="View on X"
                        >
                          ↗
                        </a>
                        <button
                          onClick={() => deleteLead(lead.id)}
                          className="px-2 py-1 text-xs bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-500 rounded transition-colors"
                          title="Remove lead"
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === lead.id && (
                    <tr className="bg-gray-50 dark:bg-gray-900/20">
                      <td colSpan={5} className="px-4 py-3 space-y-1">
                        {lead.bio && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Bio:</span> {lead.bio}
                          </p>
                        )}
                        {lead.source_tweet_text && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Tweet:</span> {lead.source_tweet_text}
                            {lead.source_tweet_id && (
                              <a
                                href={`https://x.com/${lead.username}/status/${lead.source_tweet_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-sky-500 hover:underline"
                              >
                                ↗ view
                              </a>
                            )}
                          </p>
                        )}
                        {lead.relevance_reason && (
                          <p className="text-xs text-yellow-700 dark:text-yellow-400">
                            <span className="font-medium">Grok says:</span> {lead.relevance_reason}
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Reply preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                Reply preview — @{preview.username}
              </h3>
            </div>
            <div className="p-5 space-y-4">
              {preview.sourceTweet && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Their tweet</p>
                    {preview.tweetId && (
                      <a
                        href={`https://x.com/${preview.username}/status/${preview.tweetId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-sky-500 hover:underline"
                      >
                        ↗ view on X
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/40 rounded-lg p-3 italic">
                    "{preview.sourceTweet}"
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Your reply <span className="text-gray-400">({preview.replyText.length}/280)</span>
                </p>
                <p className="text-sm text-gray-800 dark:text-gray-200 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  {preview.replyText}
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setPreview(null)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendReply}
                disabled={engaging === preview.leadId}
                className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
              >
                {engaging === preview.leadId ? 'Sending…' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
