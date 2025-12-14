// app/analytics/analytics-card-12.tsx
'use client'

import { useState, useEffect } from 'react';

export default function AnalyticsCard12() {
  const [keywords, setKeywords] = useState<Array<{keyword: string, sessions: number}>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/keywords');
      const data = await response.json();
      setKeywords(data.keywords || []);
    } catch (error) {
      console.error('Failed to fetch keywords:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <div className="animate-pulse p-8">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return(
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Organic Search Traffic</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Pages that received organic search visits
        </p>
      </header>
      <div className="p-5">
        {keywords.length > 0 ? (
          <div className="space-y-3">
            {keywords.slice(0, 8).map((item, index) => (
              <div key={item.keyword} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-6">
                    {index + 1}.
                  </span>
                  <span className="text-sm text-gray-900 dark:text-gray-100 ml-2 truncate max-w-xs">
                    {item.keyword}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {item.sessions} visits
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              <svg className="w-8 h-8 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No organic search data yet. Data will appear as people find your site through search engines.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}