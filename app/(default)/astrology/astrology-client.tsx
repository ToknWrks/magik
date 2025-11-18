// app/astrology/astrology-client.tsx
'use client';

import { useState } from 'react';
import { Boundary } from '@/components/ui/boundary';
import Link from 'next/link';
import { combinations } from './combinations';
import { astrologySymbols } from './symbols';

export function AstrologyClient() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  const categories = ['All', ...planets];

  const filteredCombinations = combinations.filter((combo) => {
    const matchesCategory = selectedCategory === 'All' || combo.category === selectedCategory || combo.category2 === selectedCategory;
    const matchesSearch = searchTerm.trim() === '' || 
      combo.title.toLowerCase().includes(searchTerm.toLowerCase().trim()) || 
      combo.description.toLowerCase().includes(searchTerm.toLowerCase().trim());
    return matchesCategory && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    // Use neutral gray colors for all statuses
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  return (
    <Boundary
      label="combination Theories Archive"
      animateRerendering={false}
      kind="solid"
      className="flex flex-col gap-9"
    >
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Archetypal & Planetary Combinations 
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
          Explore astrological theories for 45 combinations.
          Each entry includes evidence, counterarguments, and current status.
        </p>

        {/* Search Box */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search combinations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 w-full max-w-md mx-auto block"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap justify-center mb-1">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCombinations.map((combination) => (
          <Link
            key={combination.id}
            href={`/astrology/${combination.slug}`}
            className="group flex flex-col gap-4 rounded-lg bg-gray-100 px-6 py-6 hover:bg-gray-200 dark:bg-gray-950 dark:hover:bg-gray-800 transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(combination.status)}`}>
                    {combination.status}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 p-2 flex items-center gap-2">
                  <span className="text-2xl astrology-symbol">{astrologySymbols[combination.category]}</span>
                  <span className="text-2xl astrology-symbol">{astrologySymbols[combination.category2]}</span>
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 dark:text-gray-100 dark:group-hover:text-gray-300 mb-2 flex items-center gap-2">
                  {combination.title}
                </h3>
                <p className="text-sm text-gray-600 group-hover:text-gray-800 dark:text-gray-400 dark:group-hover:text-gray-300 line-clamp-3">
                  {combination.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Learn more →</span>
            </div>
          </Link>
        ))}
      </div>

      {filteredCombinations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No combinations found matching your search.
          </p>
        </div>
      )}
    </Boundary>
  );
}