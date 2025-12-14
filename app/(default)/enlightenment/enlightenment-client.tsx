// app/(default)/enlightenment/enlightenment-client.tsx
'use client';

import { useState } from 'react';
import { Boundary } from '@/components/ui/boundary';
import Link from 'next/link';

interface Teaching {
  id: string;
  slug: string;
  title: string;
  description?: string;
  category?: string;
  status?: string;
  difficulty_level?: string;
  is_active?: boolean;
}

interface EnlightenmentClientProps {
  teachings: Teaching[];
}

function StatusBadge({ status }: { status: string }) {
  const getColor = () => {
    switch (status?.toLowerCase()) {
      case 'published':
        return 'text-green-600 dark:text-green-400';
      case 'draft':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'under review':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return <span className={`text-xs font-medium ${getColor()}`}>{status}</span>;
}

function DifficultyBadge({ level }: { level: string }) {
  const getColor = () => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'text-green-600 dark:text-green-400';
      case 'intermediate':
        return 'text-yellow-700 dark:text-yellow-700';
      case 'advanced':
      case 'expert':
        return 'text-yellow-700 dark:text-yellow-700';
      case 'all-levels':
        return 'text-blue-600 dark:text-blue-400';
      case 'informational':
        return 'text-yellow-700 dark:text-yellow-700';
      case 'introductory':
        return 'text-indigo-600 dark:text-indigo-400';
      case 'practical':
      case 'meditative':
        return 'text-orange-600 dark:text-orange-400';
      case 'theoretical':
      case 'philosophical':
        return 'text-pink-600 dark:text-pink-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getDisplayText = () => {
    switch (level?.toLowerCase()) {
      case 'all-levels':
        return 'All Levels';
      case 'beginner-intermediate':
        return 'Beginner-Intermediate';
      case 'intermediate-advanced':
        return 'Intermediate-Advanced';
      default:
        return level?.charAt(0).toUpperCase() + level?.slice(1) || 'All Levels';
    }
  };

  return <span className={`text-xs font-medium ${getColor()}`}>{getDisplayText()}</span>;
}

export default function EnlightenmentClient({ teachings }: EnlightenmentClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter active teachings only
  const activeTeachings = teachings.filter(t => t.is_active !== false);

  // Get unique categories
  const categories = ['All', ...Array.from(new Set(activeTeachings.map(t => t.category).filter(Boolean)))];

  const filteredTeachings = activeTeachings.filter(teaching => {
    const matchesCategory = selectedCategory === 'All' || teaching.category === selectedCategory;
    const matchesSearch = 
      teaching.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teaching.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    return matchesCategory && matchesSearch;
  });

  return (
    <Boundary
      label="Enlightenment Archive"
      animateRerendering={false}
      kind="solid"
      className="flex flex-col gap-9"
    >
      {/* Header Section */}
      <div className="text-center mb-4">
        {/* Search Box */}
        <div className="mb-6 max-w-md mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search teachings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap justify-center">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category as string)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="font-mono text-xs font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
        {filteredTeachings.length} {filteredTeachings.length === 1 ? 'Teaching' : 'Teachings'}
      </div>

      {/* Teachings Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {filteredTeachings.map((teaching) => (
          <Link
            key={teaching.id}
            href={`/enlightenment/${teaching.slug}`}
            className="group flex flex-col gap-1 rounded-lg bg-gray-50 px-5 py-3 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-950 transition-colors"
          >
            <div className="flex items-center justify-between font-medium text-gray-900 group-hover:text-gray-700 dark:text-gray-200 dark:group-hover:text-gray-50">
              {teaching.title}
              <DifficultyBadge level={teaching.difficulty_level || ''} />
            </div>

            {teaching.description && (
              <div className="line-clamp-3 text-[13px] text-gray-600 group-hover:text-gray-800 dark:text-gray-500 dark:group-hover:text-gray-300">
                {teaching.description}
              </div>
            )}

            {teaching.category && (
              <div className="mt-1">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {teaching.category}
                </span>
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {filteredTeachings.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No teachings found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your search or filter criteria.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('All');
            }}
            className="mt-4 text-sm text-gray-600 dark:text-gray-400 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </Boundary>
  );
}