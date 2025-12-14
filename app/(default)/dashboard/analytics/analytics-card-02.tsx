'use client'

import { useState, useEffect } from 'react';
import { chartAreaGradient } from '@/components/charts/chartjs-config'
import { tailwindConfig, hexToRGB } from '@/components/utils/utils'

export default function AnalyticsCard02() {
  const [activeUsers, setActiveUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveUsers();
  }, []);

  const fetchActiveUsers = async () => {
    try {
      setLoading(true);
      // Get today's active users from GA4
      const response = await fetch('/api/analytics/ga4?metric=activeUsers&period=today');
      const data = await response.json();
      
      // GA4 doesn't provide real-time data, so we'll show today's total
      const todayUsers = data.rows?.reduce((sum: number, row: any) => sum + row.value, 0) || 0;
      setActiveUsers(todayUsers);
    } catch (error) {
      console.error('Failed to fetch active users:', error);
      setActiveUsers(0);
    } finally {
      setLoading(false);
    }
  };

  return(
    <div className="flex flex-col col-span-full xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Active Users Today</h2>
      </header>
      {/* Card content */}
      <div className="flex flex-col h-full">
        {/* Live visitors number */}
        <div className="px-5 py-3">
          <div className="flex items-center">
            {/* Green dot for active */}
            <div className="relative inline-flex items-center justify-center w-4 h-4 mr-3">
              <div className="absolute w-4 h-4 bg-green-500 rounded-full opacity-75 animate-ping"></div>
              <div className="relative w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                {loading ? '...' : activeUsers.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Active users today</div>
            </div>
          </div>
        </div>
        {/* Chart */}
        <div className="px-5 pb-2">
          <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
            Today's Trend
          </div>
          <div className="flex">
            <div className="flex-1">
              {/* Show a simple trend indicator */}
              <div className="h-8 bg-gradient-to-r from-green-200 to-green-100 dark:from-green-800 dark:to-green-700 rounded-full opacity-60"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
