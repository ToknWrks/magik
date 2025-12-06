// app/components/administratio/TemplateFormModal.tsx
'use client'

import { useState, useEffect } from 'react'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'

export interface TemplateFormData {
  title: string
  slug: string
  status: string
  category: string
  key_facts: string
  debunking_points: string
  sources: string
  difficulty_level: string
  is_active: boolean
  content_type: 'ai' | 'manual'
  article_content: string
}

export interface Template {
  id: string
  title: string
  slug: string
  status: string
  category: string
  content: string
  created_at: string
  type: 'article' | 'template'
  key_facts?: string[]
  debunking_points?: string[]
  sources?: string[]
  difficulty_level?: string
  is_active?: boolean
  content_type?: string
  article_content?: string
}

interface TemplateFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: TemplateFormData) => Promise<void>
  editingTemplate: Template | null
}

const initialFormData: TemplateFormData = {
  title: '',
  slug: '',
  status: 'Under Investigation',
  category: '',
  key_facts: '',
  debunking_points: '',
  sources: '',
  difficulty_level: 'medium',
  is_active: true,
  content_type: 'ai',
  article_content: '',
}

export default function TemplateFormModal({ 
  isOpen, 
  onClose, 
  onSave, 
  editingTemplate 
}: TemplateFormModalProps) {
  const [formData, setFormData] = useState<TemplateFormData>(initialFormData)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Populate form when editing
  useEffect(() => {
    if (editingTemplate) {
      setFormData({
        title: editingTemplate.title || '',
        slug: editingTemplate.slug || '',
        status: editingTemplate.status || 'Under Investigation',
        category: editingTemplate.category || '',
        key_facts: editingTemplate.key_facts?.join('\n') || '',
        debunking_points: editingTemplate.debunking_points?.join('\n') || '',
        sources: editingTemplate.sources?.join('\n') || '',
        difficulty_level: editingTemplate.difficulty_level || 'medium',
        is_active: editingTemplate.is_active ?? true,
        content_type: (editingTemplate.content_type as 'ai' | 'manual') || 'ai',
        article_content: editingTemplate.article_content || '',
      })
    } else {
      setFormData(initialFormData)
    }
  }, [editingTemplate, isOpen])

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      await onSave(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Title & Slug */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="form-input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="form-input w-full font-mono text-sm"
                  required
                />
              </div>
            </div>

            {/* Status & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="form-select w-full"
                >
                  <option value="Under Investigation">Under Investigation</option>
                  <option value="Verified">Verified</option>
                  <option value="Debunked">Debunked</option>
                  <option value="Partially Debunked">Partially Debunked</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="form-input w-full"
                  placeholder="e.g., Government, Secret Societies"
                />
              </div>
            </div>

            {/* Difficulty & Active */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Difficulty Level
                </label>
                <select
                  value={formData.difficulty_level}
                  onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
                  className="form-select w-full"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="form-checkbox"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>
            </div>

            {/* Content Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="content_type"
                    value="ai"
                    checked={formData.content_type === 'ai'}
                    onChange={() => setFormData({ ...formData, content_type: 'ai' })}
                    className="form-radio"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">AI Generated</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="content_type"
                    value="manual"
                    checked={formData.content_type === 'manual'}
                    onChange={() => setFormData({ ...formData, content_type: 'manual' })}
                    className="form-radio"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Manual Content</span>
                </label>
              </div>
            </div>

            {/* Key Facts */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Key Facts (one per line)
              </label>
              <textarea
                value={formData.key_facts}
                onChange={(e) => setFormData({ ...formData, key_facts: e.target.value })}
                className="form-textarea w-full"
                rows={3}
                placeholder="Enter key facts, one per line..."
              />
            </div>

            {/* Debunking Points */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Debunking Points (one per line)
              </label>
              <textarea
                value={formData.debunking_points}
                onChange={(e) => setFormData({ ...formData, debunking_points: e.target.value })}
                className="form-textarea w-full"
                rows={3}
                placeholder="Enter debunking points, one per line..."
              />
            </div>

            {/* Sources */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sources (one per line)
              </label>
              <textarea
                value={formData.sources}
                onChange={(e) => setFormData({ ...formData, sources: e.target.value })}
                className="form-textarea w-full"
                rows={3}
                placeholder="Enter sources, one per line..."
              />
            </div>

            {/* Manual Content (only shown when content_type is 'manual') */}
            {formData.content_type === 'manual' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Article Content
                </label>
                <div data-color-mode="light" className="dark:hidden">
                  <MDEditor
                    value={formData.article_content}
                    onChange={(val) => setFormData({ ...formData, article_content: val || '' })}
                    height={300}
                  />
                </div>
                <div data-color-mode="dark" className="hidden dark:block">
                  <MDEditor
                    value={formData.article_content}
                    onChange={(val) => setFormData({ ...formData, article_content: val || '' })}
                    height={300}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="btn border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}