// app/components/administratio/TemplatesTable.tsx
'use client'

import { useItemSelection } from '@/components/utils/use-item-selection'
import TemplatesTableItem from './TemplatesTableItem'

export interface Template {
    id: string
    title: string
    slug: string
    status: string
    category: string
    content: string
    created_at: string
    type: 'article' | 'template'
    }

interface TemplateTableProps {
  templates: Template[]
  onEdit: (template: Template) => void
  onDelete: (id: string) => void
}

export default function TemplatesTable({ templates, onEdit, onDelete }: TemplateTableProps) {
  const {
    selectedItems,
    isAllSelected,
    handleCheckboxChange,
    handleSelectAllChange,
  } = useItemSelection(templates.map(templates => ({ ...templates, id: String(templates?.id || 'unknown') })))

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl relative">
      <header className="px-5 py-4">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Templates <span className="text-gray-400 dark:text-gray-500 font-medium">{templates.length}</span></h2>
      </header>
      <div>
        <div className="overflow-x-auto">
          <table className="table-auto w-full dark:text-gray-300">
            <thead className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-t border-b border-gray-100 dark:border-gray-700/60">
              <tr>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap w-px">
                  <div className="flex items-center">
                    <label className="inline-flex">
                      <span className="sr-only">Select all</span>
                      <input className="form-checkbox" type="checkbox" onChange={handleSelectAllChange} checked={isAllSelected} />
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
                  <div className="font-semibold text-left">Created</div>
                </th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
                  <div className="font-semibold text-left">Actions</div>
                </th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700/60">
              {templates.map((template, index) => (
                <TemplatesTableItem
                  key={template.id || index}
                  template={template}
                  onCheckboxChange={(id, checked) => handleCheckboxChange(Number(id), checked)}
                  isSelected={selectedItems.includes(Number(template.id))}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}