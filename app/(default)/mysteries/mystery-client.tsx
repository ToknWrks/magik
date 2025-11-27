// app/conspiracies/conspiracies-client.tsx
'use client';

import { useState } from 'react';
import { Boundary } from '@/components/ui/boundary';
import Link from 'next/link';

// Mock conspiracy data - replace with your actual data
const conspiracies = [
  {
    id: 1,
    title: "The Illuminati",
    description: "A secret society founded in 1776 that allegedly controls world events through a network of influential members.",
    status: "Partially Debunked",
    category: "Secret Societies",
    slug: "illuminati"
  },
  {
    id: 2,
    title: "Moon Landing Hoax",
    description: "The theory that the 1969 moon landing was faked by NASA and filmed in a studio.",
    status: "Completely Debunked",
    category: "Space Conspiracies",
    slug: "moon-landing-hoax"
  },
  {
    id: 3,
    title: "Time Travel Trump",
    description: "The belief that former President Donald Trump used time travel technology to influence political events.",
    status: "Partially Confirmed",
    category: "Fjnord",
    slug: "donald-trump-time-traveler-messiah"
  },
  {
    id: 4,
    title: "PizzaGate",
    description: "The belief that pizzas served at a popular restaurant were part of a child trafficking ring linked to high-profile politicians.",
    status: "Debunked",
    category: "Political Conspiracies",
    slug: "pizza-gate"
  },
  {
    id: 5,
    title: "Flat Earth Theory",
    description: "The modern conspiracy theory that the Earth is flat rather than spherical.",
    status: "Completely Debunked",
    category: "Science Conspiracies",
    slug: "flat-earth"
  },
  {
    id: 6,
    title: "Chemtrails",
    description: "The theory that condensation trails left by aircraft are actually chemical or biological agents deliberately sprayed.",
    status: "Completely Debunked",
    category: "Environmental Conspiracies",
    slug: "chemtrails"
  }
];

export function ConspiraciesClient() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['All', ...Array.from(new Set(conspiracies.map(c => c.category)))];

  const filteredConspiracies = conspiracies.filter(conspiracy => {
    const matchesCategory = selectedCategory === 'All' || conspiracy.category === selectedCategory;
    const matchesSearch = conspiracy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conspiracy.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    // Use neutral gray colors for all statuses
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  return (
    <Boundary
      label="Conspiracy Theories Archive"
      animateRerendering={false}
      kind="solid"
      className="flex flex-col gap-9"
    >
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Conspiracy Theories Archive
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
          Explore documented conspiracy theories, debunked myths, and historical conspiracies.
          Each entry includes evidence, counterarguments, and current status.
        </p>

        {/* Search Box */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search conspiracies..."
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
        {filteredConspiracies.map((conspiracy) => (
          <Link
            key={conspiracy.id}
            href={`/conspiracies/${conspiracy.slug}`}
            className="group flex flex-col gap-4 rounded-lg bg-gray-100 px-6 py-6 hover:bg-gray-200 dark:bg-gray-950 dark:hover:bg-gray-800 transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(conspiracy.status)}`}>
                    {conspiracy.status}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {conspiracy.category}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 dark:text-gray-100 dark:group-hover:text-gray-300 mb-2">
                  {conspiracy.title}
                </h3>
                <p className="text-sm text-gray-600 group-hover:text-gray-800 dark:text-gray-400 dark:group-hover:text-gray-300 line-clamp-3">
                  {conspiracy.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Learn more →</span>
            </div>
          </Link>
        ))}
      </div>

      {filteredConspiracies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No conspiracies found matching your search.
          </p>
        </div>
      )}
    </Boundary>
  );
}