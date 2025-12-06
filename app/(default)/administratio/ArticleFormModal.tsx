// app/(default)/administratio/ArticleFormModal.tsx
'use client'

import { useState, useEffect } from 'react'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'

interface SectionItem {
  date: string
  content: string
}

interface Section {
  title: string
  items: SectionItem[]
}

export interface ArticleFormData {
  title: string
  slug: string
  status: 'draft' | 'published' | 'verified' | 'debunked' | 'partially debunked'
  category: string
  pre_summary: string
  post_summary: string
  sections: Section[]
}

export interface Article extends Omit<ArticleFormData, 'sections'> {
  id: string
  content: string // JSON stringified sections
  created_at: string
  type: 'article' | 'template'
}

interface ArticleFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ArticleFormData) => Promise<void>
  editingArticle: Article | null
}

const initialFormData: ArticleFormData = {
  title: '',
  slug: '',
  status: 'draft',
  category: '',
  pre_summary: '',
  post_summary: '',
  sections: [{ title: '', items: [{ date: '', content: '' }] }],
}

export default function ArticleFormModal({ 
  isOpen, 
  onClose, 
  onSave, 
  editingArticle 
}: ArticleFormModalProps) {
  const [formData, setFormData] = useState<ArticleFormData>(initialFormData)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Populate form when editing
  useEffect(() => {
    if (editingArticle) {
      let sections: Section[] = [{ title: '', items: [{ date: '', content: '' }] }]
      try {
        sections = JSON.parse(editingArticle.content) || sections
      } catch (e) {
        console.error('Failed to parse sections:', e)
      }
      
      setFormData({
        title: editingArticle.title || '',
        slug: editingArticle.slug || '',
        status: editingArticle.status || 'draft',
        category: editingArticle.category || '',
        pre_summary: editingArticle.pre_summary || '',
        post_summary: editingArticle.post_summary || '',
        sections,
      })
    } else {
      setFormData(initialFormData)
    }
  }, [editingArticle, isOpen])

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    }))
  }

  // Section management functions
  const addSection = () => {
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, { title: '', items: [{ date: '', content: '' }] }]
    }))
  }

  const removeSection = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }))
  }

  const updateSection = (sectionIndex: number, field: 'title', value: string) => {
    setFormData(prev => {
      const newSections = [...prev.sections]
      newSections[sectionIndex][field] = value
      return { ...prev, sections: newSections }
    })
  }

  // Item management functions
  const addItem = (sectionIndex: number) => {
    setFormData(prev => {
      const newSections = [...prev.sections]
      newSections[sectionIndex].items.push({ date: '', content: '' })
      return { ...prev, sections: newSections }
    })
  }

  const removeItem = (sectionIndex: number, itemIndex: number) => {
    setFormData(prev => {
      const newSections = [...prev.sections]
      newSections[sectionIndex].items = newSections[sectionIndex].items.filter((_, i) => i !== itemIndex)
      return { ...prev, sections: newSections }
    })
  }

  const updateItem = (sectionIndex: number, itemIndex: number, field: 'date' | 'content', value: string) => {
    setFormData(prev => {
      const newSections = [...prev.sections]
      newSections[sectionIndex].items[itemIndex][field] = value
      return { ...prev, sections: newSections }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      await onSave(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save article')
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
              {editingArticle ? 'Edit Article' : 'Create Article'}
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
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ArticleFormData['status'] })}
                  className="form-select w-full"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="verified">Verified</option>
                  <option value="debunked">Debunked</option>
                  <option value="partially debunked">Partially Debunked</option>
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
                  placeholder="e.g., Government, Technology, History"
                />
              </div>
            </div>

            {/* Pre-Summary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pre-Summary
              </label>
              <textarea
                value={formData.pre_summary}
                onChange={(e) => setFormData({ ...formData, pre_summary: e.target.value })}
                className="form-textarea w-full"
                rows={3}
                placeholder="Brief intro before the main content..."
              />
            </div>

            {/* Sections */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sections
                </label>
                <button 
                  type="button" 
                  onClick={addSection} 
                  className="btn-xs bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white"
                >
                  + Add Section
                </button>
              </div>
              
              {formData.sections.map((section, sIndex) => (
                <div key={sIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4 bg-gray-50 dark:bg-gray-900/50">
                  {/* Section Header */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex-1 mr-2">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Section Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Timeline, Evidence, Key Players"
                        value={section.title}
                        onChange={(e) => updateSection(sIndex, 'title', e.target.value)}
                        className="form-input w-full"
                      />
                    </div>
                    {formData.sections.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeSection(sIndex)} 
                        className="btn-xs bg-red-500 hover:bg-red-600 text-white mt-5"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Section Items */}
                  <div className="space-y-3">
                    {section.items.map((item, iIndex) => (
                      <div key={iIndex} className="pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                        <div className="flex items-start gap-3">
                          <div className="w-28 shrink-0">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Date
                            </label>
                            <input
                              type="text"
                              placeholder="1947"
                              value={item.date}
                              onChange={(e) => updateItem(sIndex, iIndex, 'date', e.target.value)}
                              className="form-input w-full text-sm"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Content
                            </label>
                            <textarea
                              placeholder="Describe the event or fact..."
                              value={item.content}
                              onChange={(e) => updateItem(sIndex, iIndex, 'content', e.target.value)}
                              className="form-textarea w-full"
                              rows={2}
                            />
                          </div>
                          {section.items.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => removeItem(sIndex, iIndex)} 
                              className="text-red-500 hover:text-red-600 mt-6"
                              title="Remove item"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    type="button" 
                    onClick={() => addItem(sIndex)} 
                    className="mt-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Item
                  </button>
                </div>
              ))}
            </div>

            {/* Post-Summary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Post-Summary / Conclusion
              </label>
              <div data-color-mode="light" className="dark:hidden">
                <MDEditor
                  value={formData.post_summary}
                  onChange={(val) => setFormData({ ...formData, post_summary: val || '' })}
                  preview="live"
                  height={200}
                />
              </div>
              <div data-color-mode="dark" className="hidden dark:block">
                <MDEditor
                  value={formData.post_summary}
                  onChange={(val) => setFormData({ ...formData, post_summary: val || '' })}
                  preview="live"
                  height={200}
                />
              </div>
            </div>
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
              {saving ? 'Saving...' : editingArticle ? 'Update Article' : 'Create Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}