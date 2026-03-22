'use client';

import { useState, useEffect } from 'react';

type Status = 'backlog' | 'planned' | 'in-progress' | 'done';
type Priority = 'low' | 'medium' | 'high';

interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  category: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; dot: string }> = {
  backlog:     { label: 'Backlog',     color: 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400',     dot: 'bg-gray-400' },
  planned:     { label: 'Planned',     color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',     dot: 'bg-blue-500' },
  'in-progress':{ label: 'In Progress', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  done:        { label: 'Done',        color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', dot: 'bg-green-500' },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  low:    { label: 'Low',    color: 'text-gray-400 dark:text-gray-500' },
  medium: { label: 'Medium', color: 'text-amber-500 dark:text-amber-400' },
  high:   { label: 'High',   color: 'text-red-500 dark:text-red-400' },
};

const STATUSES: Status[] = ['backlog', 'planned', 'in-progress', 'done'];
const PRIORITIES: Priority[] = ['low', 'medium', 'high'];

const SEED_ITEMS = [
  {
    title: 'Regen Compute MCP tracking for Solomon Sessions',
    description: 'Integrate Regen Compute MCP to track ecological footprint of AI-powered Solomon sessions. Auto-retire credits per session. Display impact to users in the session UI.',
    status: 'planned' as Status,
    priority: 'high' as Priority,
    category: 'Regen / Ecology',
  },
  {
    title: 'Invite & Points System with Referral Tracking',
    description: 'Invite-only referral system with unique invite codes. Track conversions and award points for successful referrals. Points accumulate with usage (readings, sessions). Leaderboard and point redemption for credits.',
    status: 'planned' as Status,
    priority: 'high' as Priority,
    category: 'Growth',
  },
  {
    title: 'Profile Pic Generator',
    description: 'AI-generated profile picture based on the user\'s birth chart, natal placements, and chosen aesthetic. Downloadable and shareable. Integrates with profile page.',
    status: 'backlog' as Status,
    priority: 'medium' as Priority,
    category: 'Profile',
  },
];

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function PriorityIcon({ priority }: { priority: Priority }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span className={`text-xs font-medium ${cfg.color}`} title={`${cfg.label} priority`}>
      {priority === 'high' ? '▲▲' : priority === 'medium' ? '▲' : '—'}
    </span>
  );
}

function ItemCard({
  item,
  onUpdate,
  onDelete,
}: {
  item: RoadmapItem;
  onUpdate: (id: string, patch: Partial<RoadmapItem>) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? '');
  const [category, setCategory] = useState(item.category ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await fetch('/api/roadmap', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, title, description: description || null, category: category || null }),
    });
    const data = await res.json();
    if (!data.error) { onUpdate(item.id, data); setEditing(false); }
    setSaving(false);
  };

  const changeStatus = async (status: Status) => {
    const res = await fetch('/api/roadmap', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, status }),
    });
    const data = await res.json();
    if (!data.error) onUpdate(item.id, data);
  };

  const changePriority = async (priority: Priority) => {
    const res = await fetch('/api/roadmap', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, priority }),
    });
    const data = await res.json();
    if (!data.error) onUpdate(item.id, data);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    await fetch(`/api/roadmap?id=${item.id}`, { method: 'DELETE' });
    onDelete(item.id);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-lg p-4 shadow-sm">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              className="w-full text-sm font-semibold bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          ) : (
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug">{item.title}</h3>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <PriorityIcon priority={item.priority} />
          <button
            onClick={() => { setEditing(!editing); setTitle(item.title); setDescription(item.description ?? ''); setCategory(item.category ?? ''); }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs"
            title="Edit"
          >
            {editing ? '✕' : '✎'}
          </button>
          <button onClick={handleDelete} className="text-gray-300 hover:text-red-500 text-xs" title="Delete">
            ✕
          </button>
        </div>
      </div>

      {/* Description */}
      {editing ? (
        <textarea
          className="w-full text-xs bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 mb-2 resize-none"
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description..."
        />
      ) : (
        item.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">{item.description}</p>
        )
      )}

      {/* Category edit */}
      {editing && (
        <input
          className="w-full text-xs bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 mb-2"
          value={category}
          onChange={e => setCategory(e.target.value)}
          placeholder="Category (e.g. Growth, Profile...)"
        />
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Status selector */}
          <select
            value={item.status}
            onChange={e => changeStatus(e.target.value as Status)}
            className="text-xs border-0 bg-transparent text-gray-500 dark:text-gray-400 focus:outline-none cursor-pointer"
          >
            {STATUSES.map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
          {/* Priority selector */}
          <select
            value={item.priority}
            onChange={e => changePriority(e.target.value as Priority)}
            className="text-xs border-0 bg-transparent text-gray-500 dark:text-gray-400 focus:outline-none cursor-pointer"
          >
            {PRIORITIES.map(p => (
              <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {item.category && !editing && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400">
              {item.category}
            </span>
          )}
          {editing && (
            <button
              onClick={save}
              disabled={saving || !title.trim()}
              className="text-xs px-3 py-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded font-medium"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AddItemForm({ onAdded }: { onAdded: (item: RoadmapItem) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Status>('backlog');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title required'); return; }
    setSaving(true);
    setError('');
    const res = await fetch('/api/roadmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: description || null, status, priority, category: category || null }),
    });
    const data = await res.json();
    if (data.error) { setError(data.error); setSaving(false); return; }
    onAdded(data);
    setTitle(''); setDescription(''); setStatus('backlog'); setPriority('medium'); setCategory('');
    setOpen(false);
    setSaving(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:border-violet-400 hover:text-violet-600 dark:hover:border-violet-500 dark:hover:text-violet-400 transition-colors"
      >
        + Add Item
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white dark:bg-gray-800 border border-violet-300 dark:border-violet-700 rounded-lg p-4 shadow-sm space-y-3">
      <input
        className="w-full text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Item title *"
        autoFocus
      />
      <textarea
        className="w-full text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
        rows={3}
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Description (optional)"
      />
      <div className="flex gap-2 flex-wrap">
        <select
          value={status}
          onChange={e => setStatus(e.target.value as Status)}
          className="text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </select>
        <select
          value={priority}
          onChange={e => setPriority(e.target.value as Priority)}
          className="text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label} Priority</option>)}
        </select>
        <input
          className="flex-1 min-w-[120px] text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
          value={category}
          onChange={e => setCategory(e.target.value)}
          placeholder="Category"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => setOpen(false)} className="text-sm px-3 py-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="text-sm px-4 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded font-medium"
        >
          {saving ? 'Adding…' : 'Add Item'}
        </button>
      </div>
    </form>
  );
}

export default function RoadmapPage() {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [filter, setFilter] = useState<Status | 'all'>('all');

  const load = () => {
    setLoading(true);
    fetch('/api/roadmap')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); } else { setItems(data); }
        setLoading(false);
      })
      .catch(() => { setError('Failed to load'); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleAdded = (item: RoadmapItem) => setItems(prev => [...prev, item]);
  const handleUpdate = (id: string, patch: Partial<RoadmapItem>) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  const handleDelete = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const seedItems = async () => {
    setSeeding(true);
    for (const item of SEED_ITEMS) {
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (!data.error) setItems(prev => [...prev, data]);
    }
    setSeeding(false);
  };

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = items.filter(i => i.status === s).length;
    return acc;
  }, {} as Record<Status, number>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Product Roadmap</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {items.length} item{items.length !== 1 ? 's' : ''} — {counts.done} done, {counts['in-progress']} in progress
          </p>
        </div>
        {items.length === 0 && (
          <button
            onClick={seedItems}
            disabled={seeding}
            className="text-sm px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg font-medium"
          >
            {seeding ? 'Seeding…' : 'Seed Initial Items'}
          </button>
        )}
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {STATUSES.map(s => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => setFilter(filter === s ? 'all' : s)}
              className={`text-left p-3 rounded-lg border transition-all ${
                filter === s
                  ? 'border-violet-400 dark:border-violet-600 bg-violet-50 dark:bg-violet-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <span className="text-xs text-gray-500 dark:text-gray-400">{cfg.label}</span>
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{counts[s]}</span>
            </button>
          );
        })}
      </div>

      {/* Items list */}
      {filter !== 'all' ? (
        <div className="space-y-3 mb-4">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No {STATUS_CONFIG[filter].label} items.</p>
          ) : (
            filtered.map(item => (
              <ItemCard key={item.id} item={item} onUpdate={handleUpdate} onDelete={handleDelete} />
            ))
          )}
        </div>
      ) : (
        <div className="space-y-8 mb-4">
          {STATUSES.filter(s => counts[s] > 0 || s === 'backlog').map(s => (
            <div key={s}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`} />
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {STATUS_CONFIG[s].label}
                </h2>
                <span className="text-xs text-gray-400">({counts[s]})</span>
              </div>
              <div className="space-y-3">
                {items.filter(i => i.status === s).map(item => (
                  <ItemCard key={item.id} item={item} onUpdate={handleUpdate} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add item */}
      <AddItemForm onAdded={handleAdded} />
    </div>
  );
}
