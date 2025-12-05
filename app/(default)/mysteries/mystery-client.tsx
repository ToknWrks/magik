// app/conspiracies/conspiracies-client.tsx
'use client';

import { useState } from 'react';
import { Boundary } from '@/components/ui/boundary';
import Link from 'next/link';

interface Article {
  id: number;
  slug: string;
  title: string;
  description?: string;
  category?: string;
  status?: string;
  is_active?: boolean;
}

interface MysteryClientProps {
  articles: Article[];
}

function StatusBadge({ status }: { status: string }) {
  const getColor = () => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'partially confirmed':
      case 'verified':
        return 'text-green-600 dark:text-green-400';
      case 'under investigation':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'debunked':
      case 'completely debunked':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return <span className={`text-xs font-medium ${getColor()}`}>{status}</span>;
}

export default function MysteryClient({ articles }: MysteryClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter active articles only
  const activeArticles = articles.filter(a => a.is_active !== false);

  // Get unique categories
  const categories = ['All', ...Array.from(new Set(activeArticles.map(a => a.category).filter(Boolean)))];

  const filteredArticles = activeArticles.filter(article => {
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
    const matchesSearch = 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    return matchesCategory && matchesSearch;
  });

  return (
    <Boundary
      label="Mysteries Archive"
      animateRerendering={false}
      kind="solid"
      className="flex flex-col gap-9"
    >
      {/* Header Section */}
      <div className="text-center mb-4">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Mysteries Archive
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
          Explore documented mysteries, unexplained phenomena, and historical enigmas.
          Each entry includes evidence, analysis, and our current assessment.
        </p>

        {/* Search Box */}
        <div className="mb-6 max-w-md mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search mysteries..."
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
        {filteredArticles.length} {filteredArticles.length === 1 ? 'Mystery' : 'Mysteries'}
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {filteredArticles.map((article) => (
          <Link
            key={article.id}
            href={`/mysteries/${article.slug}`}
            className="group flex flex-col gap-1 rounded-lg bg-gray-50 px-5 py-3 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-950 transition-colors"
          >
            <div className="flex items-center justify-between font-medium text-gray-900 group-hover:text-gray-700 dark:text-gray-200 dark:group-hover:text-gray-50">
              {article.title}
              {article.status && <StatusBadge status={article.status} />}
            </div>

            {article.description && (
              <div className="line-clamp-3 text-[13px] text-gray-600 group-hover:text-gray-800 dark:text-gray-500 dark:group-hover:text-gray-300">
                {article.description}
              </div>
            )}

            {article.category && (
              <div className="mt-1">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {article.category}
                </span>
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {filteredArticles.length === 0 && (
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
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No mysteries found
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