// app/admin/AdminDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MDEditor from '@uiw/react-md-editor';  // Replace SimpleMDE import
import '@uiw/react-md-editor/markdown-editor.css';  // Add CSS

interface ConspiracyTemplate {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  prompt_template: string; 
  key_facts: string[];
  debunking_points: string[];
  sources: string[];
  difficulty_level: string;
  is_active: boolean;
  created_at: string;
  article_content: string;
}

export default function AdminDashboard() {
  const [templates, setTemplates] = useState<ConspiracyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ConspiracyTemplate | null>(null);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/admin/templates/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== id));
      } else {
        alert('Failed to delete template');
      }
    } catch (error) {
      alert('Failed to delete template');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      });

      if (response.ok) {
        setTemplates(templates.map(t => 
          t.id === id ? { ...t, is_active: !isActive } : t
        ));
      } else {
        alert('Failed to update template');
      }
    } catch (error) {
      alert('Failed to update template');
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="p-8 max-w-7xl mx-auto pt-20">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-none hover:bg-red-700 transition-colors"
          >
            Add New Template
          </button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-none shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Conspiracy Templates</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3">Title</th>
                  <th className="text-left py-3">Category</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-left py-3">Difficulty</th>
                  <th className="text-left py-3">Active</th>
                  <th className="text-left py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 font-medium">
                      <Link href={`/conspiracies/${template.slug}`} className="text-blue-600 hover:text-blue-800 underline">
                        {template.title}
                      </Link>
                    </td>
                    <td className="py-3">{template.category}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-none text-xs ${
                        template.status === 'Completely Debunked' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : template.status === 'Partially Debunked'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {template.status}
                      </span>
                    </td>
                    <td className="py-3 capitalize">{template.difficulty_level}</td>
                    <td className="py-3">
                      <button
                        onClick={() => toggleActive(template.id, template.is_active)}
                        className={`px-2 py-1 rounded-none text-xs ${
                          template.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {template.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEditingTemplate(template)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => deleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        {(showAddForm || editingTemplate) && (
          <TemplateForm 
            template={editingTemplate}
            onClose={() => {
              setShowAddForm(false);
              setEditingTemplate(null);
            }}
            onSave={() => {
              setShowAddForm(false);
              setEditingTemplate(null);
              fetchTemplates();
            }}
          />
        )}
      </div>
    </div>
  );
}

// Template Form Component
function TemplateForm({ 
  template, 
  onClose, 
  onSave 
}: { 
  template?: ConspiracyTemplate | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    title: template?.title || '',
    slug: template?.slug || '',
    category: template?.category || '',
    status: template?.status || 'Partially Debunked',
    article_content: template?.article_content || '', // Add this
    prompt_template: template?.prompt_template || '', // Add this
    key_facts: template?.key_facts?.join('\n') || '',
    debunking_points: template?.debunking_points?.join('\n') || '',
    sources: template?.sources?.join('\n') || '',
    difficulty_level: template?.difficulty_level || 'medium',
    is_active: template?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      ...formData,
      key_facts: formData.key_facts.split('\n').filter(f => f.trim()),
      debunking_points: formData.debunking_points.split('\n').filter(f => f.trim()),
      sources: formData.sources.split('\n').filter(f => f.trim()),
    };

    try {
      const url = template ? `/api/admin/templates/${template.id}` : '/api/admin/templates';
      const method = template ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        onSave();
      } else {
        alert('Failed to save template');
      }
    } catch (error) {
      alert('Failed to save template');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-none p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          {template ? 'Edit Template' : 'Add New Template'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Slug
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <option value="Completely Debunked">Completely Debunked</option>
                <option value="Partially Debunked">Partially Debunked</option>
                <option value="Partially Confirmed">Partially Confirmed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Prompt Template
            </label>
            <input
              type="text"
              value={formData.prompt_template}
              onChange={(e) => setFormData({ ...formData, prompt_template: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Key Facts (one per line)
            </label>
            <textarea
              value={formData.key_facts}
              onChange={(e) => setFormData({...formData, key_facts: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              rows={3}
              placeholder="Fact 1&#10;Fact 2&#10;Fact 3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Debunking Points (one per line)
            </label>
            <textarea
              value={formData.debunking_points}
              onChange={(e) => setFormData({...formData, debunking_points: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              rows={3}
              placeholder="Point 1&#10;Point 2&#10;Point 3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sources (one per line)
            </label>
            <textarea
              value={formData.sources}
              onChange={(e) => setFormData({...formData, sources: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              rows={2}
              placeholder="Source 1&#10;Source 2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Article Content
            </label>
            <MDEditor
              value={formData.article_content}
              onChange={(value) => setFormData({ ...formData, article_content: value || '' })}
              preview="edit"  // Or "live" for side-by-side
              hideToolbar={false}
              visibleDragbar={false}
              className="dark:bg-gray-800"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-none text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-none hover:bg-gray-900 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-100"
            >
              {template ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

