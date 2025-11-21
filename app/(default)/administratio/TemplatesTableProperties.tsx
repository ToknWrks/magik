// app/components/administratio/TemplatesTableProperties.tsx
import { ReactElement } from 'react'

export const TemplatesProperties = () => {
  const statusColor = (status: string): string => {
    switch (status) {
      case 'published':
        return 'bg-green-500/20 text-green-700';
      case 'verified':
        return 'bg-blue-500/20 text-blue-700';
      case 'debunked':
        return 'bg-red-500/20 text-red-700';
      case 'partially debunked':
        return 'bg-yellow-500/20 text-yellow-700';
      case 'draft':
        return 'bg-gray-500/20 text-gray-700';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400';
    }
  };

  const categoryIcon = (category: string): ReactElement => {
    switch (category) {
      case 'history':
        return (
          <svg className="fill-current text-gray-400 dark:text-gray-500 shrink-0 mr-2" width="16" height="16" viewBox="0 0 16 16">
            <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 12c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" />
          </svg>
        )
      default:
        return (
          <svg className="fill-current text-gray-400 dark:text-gray-500 shrink-0 mr-2" width="16" height="16" viewBox="0 0 16 16">
            <path d="M11.4 0L10 1.4l2 2H8.4c-2.8 0-5 2.2-5 5V12l-2-2L0 11.4l3.7 3.7c.2.2.4.3.7.3.3 0 .5-.1.7-.3l3.7-3.7L7.4 10l-2 2V8.4c0-1.7 1.3-3 3-3H12l-2 2 1.4 1.4 3.7-3.7c.4-.4.4-1 0-1.4L11.4 0z" />
          </svg>
        )
    }
  };

  return {
    statusColor,
    categoryIcon,
  }
}