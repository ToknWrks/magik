// app/components/administratio/ArticlesTableItem.tsx
import { Article } from './ArticlesTable'
import { ArticlesProperties } from './ArticlesTableProperties' 
import Link from 'next/link'

interface ArticlesTableItemProps {
  article: Article
  onCheckboxChange: (id: string, checked: boolean) => void
  isSelected: boolean
  onEdit: (article: Article) => void
  onDelete: (id: string) => void
}

export default function ArticlesTableItem({ 
  article, 
  onCheckboxChange, 
  isSelected, 
  onEdit, 
  onDelete 
}: ArticlesTableItemProps) {
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    onCheckboxChange(article.id, e.target.checked)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onEdit(article)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this article?')) {
      onDelete(article.id)
    }
  }

  const { statusColor, categoryIcon } = ArticlesProperties()

  const linkHref = article.type === 'template' 
    ? `/conspiracies/${article.slug}` 
    : `/articles/${article.slug}`

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/25">
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap w-px">
        <div className="flex items-center">
          <label className="inline-flex">
            <span className="sr-only">Select</span>
            <input 
              className="form-checkbox" 
              type="checkbox" 
              onChange={handleCheckboxChange} 
              checked={isSelected}
              onClick={(e) => e.stopPropagation()}
            />
          </label>
        </div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
        <Link 
          href={linkHref} 
          className="font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
        >
          {article.title}
        </Link>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
        <div className="text-gray-600 dark:text-gray-400 font-mono text-xs">{article.slug}</div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
        <div className={`inline-flex font-medium rounded-full text-center px-2.5 py-0.5 ${statusColor(article.status)}`}>
          {article.status}
        </div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
        <div className="flex items-center">
          {categoryIcon(article.category)}
          <span className="ml-1">{article.category}</span>
        </div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap">
        <div className="text-gray-500 text-sm">
          {new Date(article.created_at).toLocaleDateString()}
        </div>
      </td>
      <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap w-px">
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleEdit} 
            className="text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
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