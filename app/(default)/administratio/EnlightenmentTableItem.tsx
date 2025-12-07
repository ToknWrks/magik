// app/(default)/administratio/EnlightenmentTableItem.tsx
import { EnlightenmentTemplate } from './EnlightenmentFormModal'
import { EnlightenmentProperties } from './EnlightenmentTableProperties' 
import Link from 'next/link'

interface EnlightenmentTableItemProps {
  template: EnlightenmentTemplate
  onCheckboxChange: (id: string, checked: boolean) => void
  isSelected: boolean
  onEdit: (template: EnlightenmentTemplate) => void
  onDelete: (id: string) => void
}

export default function EnlightenmentTableItem({ 
  template, 
  onCheckboxChange, 
  isSelected, 
  onEdit, 
  onDelete 
}: EnlightenmentTableItemProps) {
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    onCheckboxChange(template.id, e.target.checked)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onEdit(template)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this teaching?')) {
      onDelete(template.id)
    }
  }

  const { statusColor, difficultyColor, categoryIcon } = EnlightenmentProperties()

  return (
    <tr className="hover:bg-purple-50 dark:hover:bg-purple-900/10">
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap w-px">
        <div className="flex items-center">
          <label className="inline-flex">
            <span className="sr-only">Select</span>
            <input 
              className="form-checkbox text-purple-600" 
              type="checkbox" 
              onChange={handleCheckboxChange} 
              checked={isSelected}
              onClick={(e) => e.stopPropagation()}
            />
          </label>
        </div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-8 h-8 shrink-0 mr-3 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <Link 
            href={`/enlightenment/${template.slug}`}
            className="font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
          >
            {template.title}
          </Link>
        </div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
        <div className="text-gray-600 dark:text-gray-400 font-mono text-xs">{template.slug}</div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
        <div className={`inline-flex font-medium rounded-full text-center px-2.5 py-0.5 text-xs ${statusColor(template.status)}`}>
          {template.status}
        </div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
        <div className="flex items-center">
          {categoryIcon(template.category)}
          <span className="text-sm">{template.category}</span>
        </div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
        <div className={`inline-flex font-medium rounded-full text-center px-2.5 py-0.5 text-xs ${difficultyColor(template.difficulty_level || '')}`}>
          {template.difficulty_level || 'All Levels'}
        </div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
        <div className="flex items-center">
          {template.is_active ? (
            <span className="inline-flex items-center text-green-600 dark:text-green-400">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-xs">Active</span>
            </span>
          ) : (
            <span className="inline-flex items-center text-gray-400 dark:text-gray-500">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-xs">Inactive</span>
            </span>
          )}
        </div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
        <div className="text-gray-500 text-sm">
          {new Date(template.created_at).toLocaleDateString()}
        </div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap w-px">
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleEdit} 
            className="text-gray-400 hover:text-purple-500 dark:text-gray-500 dark:hover:text-purple-400 p-1 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20"
            title="Edit"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 16 16">
              <path d="M11.7 1.3c-.4-.4-1-.4-1.4 0l-8 8c-.2.2-.3.4-.3.7v2c0 .6.4 1 1 1h2c.3 0 .5-.1.7-.3l8-8c.4-.4.4-1 0-1.4l-2-2zM4 12H3v-1l6-6 1 1-6 6z" />
            </svg>
          </button>
          <button 
            onClick={handleDelete} 
            className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Delete"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 16 16">
              <path d="M5 7h2v6H5zM9 7h2v6H9zM10 3V2H6v1H2v2h1v9c0 .6.4 1 1 1h8c.6 0 1-.4 1-1V5h1V3h-4zM4 14V5h8v9H4z" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  )
}