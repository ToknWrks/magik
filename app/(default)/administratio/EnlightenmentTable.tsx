// app/(default)/administratio/EnlightenmentTable.tsx
'use client'

import { useState } from 'react'
import EnlightenmentTableItem from './EnlightenmentTableItem'
import { EnlightenmentTemplate } from './EnlightenmentFormModal'

interface EnlightenmentTableProps {
  templates: EnlightenmentTemplate[]
  onEdit: (template: EnlightenmentTemplate) => void
  onDelete: (id: string) => void
}

export default function EnlightenmentTable({ templates, onEdit, onDelete }: EnlightenmentTableProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  const handleCheckboxChange = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, id])
    } else {
      setSelectedItems(selectedItems.filter(item => item !== id))
    }
  }

  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItems(templates.map(t => t.id))
    } else {
      setSelectedItems([])
    }
  }

  const isAllSelected = templates.length > 0 && selectedItems.length === templates.length

  const handleDeleteSelected = async () => {
    if (!confirm(`Delete ${selectedItems.length} selected teachings?`)) return
    
    for (const id of selectedItems) {
      await onDelete(id)
    }
    setSelectedItems([])
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl relative border border-purple-100 dark:border-purple-900/30">
      <header className="px-5 py-4 flex justify-between items-center border-b border-purple-100 dark:border-purple-900/30 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">
            Spiritual Teachings <span className="text-purple-500 dark:text-purple-400 font-medium">{templates.length}</span>
          </h2>
        </div>
        {selectedItems.length > 0 && (
          <button
            onClick={handleDeleteSelected}
            className="btn-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
          >
            Delete Selected ({selectedItems.length})
          </button>
        )}
      </header>
      <div>
        <div className="overflow-x-auto">
          <table className="table-auto w-full dark:text-gray-300">
            <thead className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-b border-gray-100 dark:border-gray-700/60">
              <tr>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap w-px">
                  <div className="flex items-center">
                    <label className="inline-flex">
                      <span className="sr-only">Select all</span>
                      <input 
                        className="form-checkbox text-purple-600" 
                        type="checkbox" 
                        onChange={handleSelectAllChange} 
                        checked={isAllSelected} 
                      />
                    </label>
                  </div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Title</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Slug</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Status</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Category</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Level</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Active</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Created</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Actions</div>
                </th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700/60">
              {templates.map(template => (
                <EnlightenmentTableItem
                  key={template.id}
                  template={template}
                  onCheckboxChange={handleCheckboxChange}
                  isSelected={selectedItems.includes(template.id)}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {templates.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No teachings yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Create your first spiritual teaching to get started.
          </p>
        </div>
      )}
    </div>
  )
}