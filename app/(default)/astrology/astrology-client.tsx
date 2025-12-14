// app/astrology/astrology-client.tsx
'use client';

import { useState } from 'react';
import { Boundary } from '@/components/ui/boundary';
import Link from 'next/link';

interface Combination {
  id: string;
  slug: string;
  title: string;
  description?: string;
  category?: string;
  category2?: string;
  status?: string;
  is_active?: boolean;
}

interface AstrologyClientProps {
  combinations: Combination[];
}

function StatusBadge({ status }: { status: string }) {
  const getColor = () => {
    switch (status?.toLowerCase()) {
      case 'planetary pairs':
        return 'text-gray-600 dark:text-gray-400';
      case 'under development':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return <span className={`text-xs font-medium ${getColor()}`}>{status}</span>;
}

function PlanetIcon({ planet }: { planet: string }) {
  const symbols: Record<string, string> = {
    'Sun': '☉', 'Moon': '☽', 'Mercury': '☿', 'Venus': '♀',
    'Mars': '♂', 'Jupiter': '♃', 'Saturn': '♄', 'Uranus': '⛢',
    'Neptune': '♆', 'Pluto': '♇'
  };

  return (
    <span className="text-lg" title={planet}>
      {symbols[planet] || '✨'}
    </span>
  );
}

export default function AstrologyClient({ combinations: initialCombinations }: AstrologyClientProps) {
  const [combinations, setCombinations] = useState<Combination[]>(initialCombinations);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter active combinations only
  const activeCombinations = combinations.filter(c => c.is_active !== false);

  // Get unique planets for filtering
  const planets = ['All', ...Array.from(new Set([
    ...activeCombinations.map(c => c.category).filter(Boolean),
    ...activeCombinations.map(c => c.category2).filter(Boolean)
  ]))];

  const filteredCombinations = activeCombinations.filter(combination => {
    const matchesCategory = selectedCategory === 'All' || 
      combination.category === selectedCategory || 
      combination.category2 === selectedCategory;
    const matchesSearch = 
      combination.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (combination.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    return matchesCategory && matchesSearch;
  });

  return (
    <Boundary
      label="Archetypal Astrology Combinations"
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
              placeholder="Search combinations..."
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

        {/* Planet Filter */}
        <div className="flex gap-2 flex-wrap justify-center">
          {planets.map(planet => (
            <button
              key={planet}
              onClick={() => setSelectedCategory(planet as string)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === planet
                  ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {planet === 'All' ? planet : `${planet} ${getPlanetSymbol(planet || '')}`}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="font-mono text-xs font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
        {filteredCombinations.length} {filteredCombinations.length === 1 ? 'Combination' : 'Combinations'}
      </div>

      {/* Combinations Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {filteredCombinations.map((combination) => (
          <Link
            key={combination.id}
            href={`/astrology/${combination.slug}`}
            className="group flex flex-col gap-1 rounded-lg bg-gray-50 px-5 py-3 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-950 transition-colors"
          >
            <div className="flex items-center justify-between font-medium text-gray-900 group-hover:text-gray-700 dark:text-gray-200 dark:group-hover:text-gray-50">
              {combination.title}
              <StatusBadge status={combination.status || ''} />
            </div>

            {combination.description && (
              <div className="line-clamp-3 text-[13px] text-gray-600 group-hover:text-gray-800 dark:text-gray-500 dark:group-hover:text-gray-300">
                {combination.description}
              </div>
            )}

            {/* Planet icons at bottom right, bigger */}
            <div className="flex justify-end items-center gap-2 mt-2">
              <span className="text-3xl">{getPlanetSymbol(combination.category || '')}</span>
             
              <span className="text-3xl">{getPlanetSymbol(combination.category2 || '')}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {filteredCombinations.length === 0 && (
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
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No combinations found
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

// Planet symbols helper
function getPlanetSymbol(planet: string): string {
  const symbols: Record<string, string> = {
    'Sun': '☉', 'Moon': '☽', 'Mercury': '☿', 'Venus': '♀',
    'Mars': '♂', 'Jupiter': '♃', 'Saturn': '♄', 'Uranus': '⛢',
    'Neptune': '♆', 'Pluto': '♇'
  };
  return symbols[planet] || '✨';
}