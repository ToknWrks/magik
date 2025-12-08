// app/(default)/administratio/EnlightenmentFormModal.tsx
'use client'

import { useState, useEffect } from 'react'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'

export interface EnlightenmentFormData {
  title: string
  slug: string
  description: string
  status: string
  category: string
  key_teachings: string
  spiritual_practices: string
  sources: string
  keywords: string  // Add this
  difficulty_level: string
  is_active: boolean
  content_type: 'ai' | 'manual'
  article_content: string
}

export interface EnlightenmentTemplate {
  id: string
  title: string
  slug: string
  description?: string
  status: string
  category: string
  key_teachings?: string[]
  spiritual_practices?: string[]
  sources?: string[]
  keywords?: string[]  // Add this
  difficulty_level?: string
  is_active?: boolean
  content_type?: string
  article_content?: string
  created_at: string
  type: 'enlightenment'
}

interface EnlightenmentFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: EnlightenmentFormData) => Promise<void>
  editingTemplate: EnlightenmentTemplate | null
}

const initialFormData: EnlightenmentFormData = {
  title: '',
  slug: '',
  description: '',
  status: 'Draft',
  category: '',
  key_teachings: '',
  spiritual_practices: '',
  sources: '',
  keywords: '',  // Add this
  difficulty_level: 'beginner',
  is_active: true,
  content_type: 'ai',
  article_content: '',
}

const categories = [
  'Meditation',
  'Mindfulness',
  'Buddhism',
  'Hinduism',
  'Taoism',
  'Mysticism',
  'Yoga',
  'Consciousness',
  'Wisdom Traditions',
  'Self-Realization',
  'Energy Work',
  'Sacred Texts',
  'Philosophy',
  'Other',
]

export default function EnlightenmentFormModal({ 
  isOpen, 
  onClose, 
  onSave, 
  editingTemplate 
}: EnlightenmentFormModalProps) {
  const [formData, setFormData] = useState<EnlightenmentFormData>(initialFormData)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Populate form when editing
  useEffect(() => {
    if (editingTemplate) {
      setFormData({
        title: editingTemplate.title || '',
        slug: editingTemplate.slug || '',
        description: editingTemplate.description || '',
        status: editingTemplate.status || 'Draft',
        category: editingTemplate.category || '',
        key_teachings: editingTemplate.key_teachings?.join('\n') || '',
        spiritual_practices: editingTemplate.spiritual_practices?.join('\n') || '',
        sources: editingTemplate.sources?.join('\n') || '',
        keywords: editingTemplate.keywords?.join('\n') || '',  // Add this
        difficulty_level: editingTemplate.difficulty_level || 'beginner',
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
      setError(err instanceof Error ? err.message : 'Failed to save teaching')
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
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {editingTemplate ? 'Edit Spiritual Teaching' : 'Create Spiritual Teaching'}
              </h2>
              <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                Share wisdom and spiritual insights
              </p>
            </div>
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
                  placeholder="e.g., The Art of Mindful Living"
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

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="form-textarea w-full"
                rows={2}
                placeholder="A brief description of this spiritual teaching..."
              />
            </div>

            {/* Category & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="form-select w-full"
                >
                  <option value="">Select a category...</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="form-select w-full"
                >
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                  <option value="Under Review">Under Review</option>
                </select>
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
                  <option value="beginner">Beginner - New to spiritual practice</option>
                  <option value="intermediate">Intermediate - Some experience</option>
                  <option value="advanced">Advanced - Experienced practitioners</option>
                  <option value="All Levels"></option>
                </select>
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="form-checkbox text-purple-600"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active (visible to public)</span>
                </label>
              </div>
            </div>

            {/* Content Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="content_type"
                    value="ai"
                    checked={formData.content_type === 'ai'}
                    onChange={() => setFormData({ ...formData, content_type: 'ai' })}
                    className="form-radio text-purple-600"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    AI Generated
                    <span className="text-xs text-gray-500 ml-1">(uses key teachings as prompts)</span>
                  </span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="content_type"
                    value="manual"
                    checked={formData.content_type === 'manual'}
                    onChange={() => setFormData({ ...formData, content_type: 'manual' })}
                    className="form-radio text-purple-600"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Manual Content
                    <span className="text-xs text-gray-500 ml-1">(write your own)</span>
                  </span>
                </label>
              </div>
            </div>

            {/* Key Teachings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Key Teachings <span className="text-xs text-gray-500">(one per line)</span>
              </label>
              <textarea
                value={formData.key_teachings}
                onChange={(e) => setFormData({ ...formData, key_teachings: e.target.value })}
                className="form-textarea w-full"
                rows={4}
                placeholder="The nature of consciousness
Living in the present moment
The illusion of separation
Finding inner peace"
              />
            </div>

            {/* Spiritual Practices */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Spiritual Practices <span className="text-xs text-gray-500">(one per line)</span>
              </label>
              <textarea
                value={formData.spiritual_practices}
                onChange={(e) => setFormData({ ...formData, spiritual_practices: e.target.value })}
                className="form-textarea w-full"
                rows={4}
                placeholder="Daily meditation practice
Mindful breathing exercises
Gratitude journaling
Walking meditation"
              />
            </div>

            {/* Sources */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sources & References <span className="text-xs text-gray-500">(one per line)</span>
              </label>
              <textarea
                value={formData.sources}
                onChange={(e) => setFormData({ ...formData, sources: e.target.value })}
                className="form-textarea w-full"
                rows={3}
                placeholder="The Power of Now - Eckhart Tolle
Tao Te Ching - Lao Tzu
Autobiography of a Yogi - Paramahansa Yogananda"
              />
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Auto-Link Keywords <span className="text-xs text-gray-500">(one per line)</span>
              </label>
              <textarea
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                className="form-textarea w-full"
                rows={3}
                placeholder="meditation
mindfulness
inner peace
meditate"
              />
              <p className="text-xs text-gray-500 mt-1">
                These terms will automatically link to this teaching when found in other content.
              </p>
            </div>

            {/* Manual Content (only shown when content_type is 'manual') */}
            {formData.content_type === 'manual' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Article Content <span className="text-red-500">*</span>
                </label>
                <div data-color-mode="light" className="dark:hidden">
                  <MDEditor
                    value={formData.article_content}
                    onChange={(val) => setFormData({ ...formData, article_content: val || '' })}
                    height={400}
                    preview="edit"
                  />
                </div>
                <div data-color-mode="dark" className="hidden dark:block">
                  <MDEditor
                    value={formData.article_content}
                    onChange={(val) => setFormData({ ...formData, article_content: val || '' })}
                    height={400}
                    preview="edit"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {formData.content_type === 'ai' 
                ? '✨ AI will generate content based on key teachings' 
                : '📝 Write your own spiritual content'}
            </div>
            <div className="flex gap-3">
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
                className="btn bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  editingTemplate ? 'Update Teaching' : 'Create Teaching'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}