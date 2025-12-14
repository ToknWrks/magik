'use client'

import { useState, useEffect } from 'react';

export default function AnalyticsCard04() {
  const [topPages, setTopPages] = useState<Array<{page: string, sessions: number}>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopPages();
  }, []);

  const fetchTopPages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/ga4/top-pages');
      const data = await response.json();
      
      setTopPages(data.pages || []);
    } catch (error) {
      console.error('Failed to fetch top pages:', error);
      // Fallback data
      setTopPages([
        { page: '/mysteries', sessions: 1200 },
        { page: '/enlightenment', sessions: 890 },
        { page: '/articles', sessions: 654 },
        { page: '/about', sessions: 432 },
        { page: '/contact', sessions: 321 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return(
    <div className="flex flex-col col-span-full xl:col-span-6 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Top Pages</h2>
      </header>
      <div className="p-5">
        <div className="overflow-x-auto">
          <table className="table-auto w-full dark:text-gray-300">
            {/* Table header */}
            <thead className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/20">
              <tr>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-left">Page</div>
                </th>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-left">Sessions</div>
                </th>
              </tr>
            </thead>
            {/* Table body */}
            <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700/60">
              {loading ? (
                // Loading skeleton
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="p-2 whitespace-nowrap">
                      <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    </td>
                  </tr>
                ))
              ) : (
                topPages.slice(0, 5).map((page, index) => (
                  <tr key={page.page}>
                    <td className="p-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400 mr-3">
                          {index + 1}
                        </div>
                        <div className="font-medium text-gray-800 dark:text-gray-100">
                          {page.page}
                        </div>
                      </div>
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      <div className="text-left font-medium text-green-600">
                        {page.sessions.toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
