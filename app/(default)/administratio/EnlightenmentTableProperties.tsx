// app/(default)/administratio/EnlightenmentTableProperties.tsx
import { ReactElement } from 'react'

export const EnlightenmentProperties = () => {
  const statusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'published':
        return 'bg-green-500/20 text-green-700 dark:text-green-400';
      case 'draft':
        return 'bg-gray-500/20 text-gray-700 dark:text-gray-400';
      case 'under review':
        return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400';
    }
  };

  const difficultyColor = (level: string): string => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'advanced':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const categoryIcon = (category: string): ReactElement => {
    switch (category?.toLowerCase()) {
      case 'meditation':
        return (
          <svg className="fill-current text-purple-400 dark:text-purple-500 shrink-0 mr-2" width="16" height="16" viewBox="0 0 16 16">
            <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 14A6 6 0 118 2a6 6 0 010 12zm0-9a1 1 0 00-1 1v3a1 1 0 001 1h2a1 1 0 100-2H9V6a1 1 0 00-1-1z" />
          </svg>
        );
      case 'mindfulness':
        return (
          <svg className="fill-current text-green-400 dark:text-green-500 shrink-0 mr-2" width="16" height="16" viewBox="0 0 16 16">
            <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 12c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" />
          </svg>
        );
      case 'buddhism':
      case 'hinduism':
      case 'taoism':
        return (
          <svg className="fill-current text-orange-400 dark:text-orange-500 shrink-0 mr-2" width="16" height="16" viewBox="0 0 16 16">
            <path d="M8 0L6 5.934H0l4.89 3.954L2.968 16 8 12.223 13.032 16 11.11 9.888 16 5.934h-6L8 0z" />
          </svg>
        );
      case 'yoga':
        return (
          <svg className="fill-current text-pink-400 dark:text-pink-500 shrink-0 mr-2" width="16" height="16" viewBox="0 0 16 16">
            <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM4 8a4 4 0 118 0 4 4 0 01-8 0z" />
          </svg>
        );
      case 'consciousness':
        return (
          <svg className="fill-current text-indigo-400 dark:text-indigo-500 shrink-0 mr-2" width="16" height="16" viewBox="0 0 16 16">
            <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z" />
            <circle cx="8" cy="8" r="3" />
          </svg>
        );
      default:
        return (
          <svg className="fill-current text-purple-400 dark:text-purple-500 shrink-0 mr-2" width="16" height="16" viewBox="0 0 16 16">
            <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 12a4 4 0 110-8 4 4 0 010 8z" />
          </svg>
        );
    }
  };

  return {
    statusColor,
    difficultyColor,
    categoryIcon,
  }
}