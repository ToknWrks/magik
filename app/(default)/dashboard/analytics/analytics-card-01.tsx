'use client'

import { useState, useEffect } from 'react';
import LineChart03 from '@/components/charts/line-chart-03'
import { chartAreaGradient } from '@/components/charts/chartjs-config'
import { tailwindConfig, hexToRGB } from '@/components/utils/utils'

export default function AnalyticsCard01() {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/ga4?metric=activeUsers');
      const data = await response.json();
      
      // Calculate totals from GA4 data
      const totalUsers = data.rows?.reduce((sum: number, row: any) => sum + row.value, 0) || 0;
      const totalSessions = data.rows?.reduce((sum: number, row: any) => sum + row.sessions, 0) || 0;
      const avgBounceRate = data.rows?.reduce((sum: number, row: any) => sum + row.bounceRate, 0) / data.rows?.length || 0;
      const avgDuration = data.rows?.reduce((sum: number, row: any) => sum + row.avgDuration, 0) / data.rows?.length || 0;
      
      setAnalyticsData({
        visitors: totalUsers,
        pageviews: totalSessions,
        bounceRate: Math.round(avgBounceRate),
        avgDuration: Math.round(avgDuration),
        chartData: data.rows || [],
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create chart data from GA4 response
  const chartData = {
    labels: analyticsData?.chartData?.map((row: any) => row.date) || [],
    datasets: [
      {
        label: 'Visitors',
        data: analyticsData?.chartData?.map((row: any) => row.value) || [],
        fill: true,
        backgroundColor: function(context: any) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          const gradientOrColor = chartAreaGradient(ctx, chartArea, [
            { stop: 0, color: `rgba(${hexToRGB(tailwindConfig.theme.colors.violet[500])}, 0)` },
            { stop: 1, color: `rgba(${hexToRGB(tailwindConfig.theme.colors.violet[500])}, 0.2)` }
          ]);
          return gradientOrColor || 'transparent';
        },     
        borderColor: tailwindConfig.theme.colors.violet[500],
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: tailwindConfig.theme.colors.violet[500],
        pointHoverBackgroundColor: tailwindConfig.theme.colors.violet[500],
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        clip: 20,
        tension: 0.2,
      },
    ],
  }

  if (loading) {
    return (
      <div className="flex flex-col col-span-full xl:col-span-8 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <div className="animate-pulse p-8">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return(
    <div className="flex flex-col col-span-full xl:col-span-8 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Analytics</h2>
      </header>
      <div className="px-5 py-1">
        <div className="flex flex-wrap max-sm:*:w-1/2">
          {/* Unique Visitors */}
          <div className="flex items-center py-2">
            <div className="mr-5">
              <div className="flex items-center">
                <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mr-2">
                  {analyticsData?.visitors?.toLocaleString() || '0'}
                </div>
                <div className="text-sm font-medium text-green-600">+49%</div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Unique Visitors</div>
            </div>
            <div className="hidden md:block w-px h-8 bg-gray-200 dark:bg-gray-700 mr-5" aria-hidden="true"></div>
          </div>
          {/* Total Pageviews */}
          <div className="flex items-center py-2">
            <div className="mr-5">
              <div className="flex items-center">
                <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mr-2">
                  {analyticsData?.pageviews?.toLocaleString() || '0'}
                </div>
                <div className="text-sm font-medium text-green-600">+7%</div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Pageviews</div>
            </div>
            <div className="hidden md:block w-px h-8 bg-gray-200 dark:bg-gray-700 mr-5" aria-hidden="true"></div>
          </div>
          {/* Bounce Rate */}
          <div className="flex items-center py-2">
            <div className="mr-5">
              <div className="flex items-center">
                <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mr-2">
                  {analyticsData?.bounceRate || '0'}%
                </div>
                <div className="text-sm font-medium text-red-500">-7%</div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Bounce Rate</div>
            </div>
            <div className="hidden md:block w-px h-8 bg-gray-200 dark:bg-gray-700 mr-5" aria-hidden="true"></div>
          </div>
          {/* Visit Duration*/}
          <div className="flex items-center">
            <div>
              <div className="flex items-center">
                <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mr-2">
                  {Math.floor((analyticsData?.avgDuration || 0) / 60)}m {(analyticsData?.avgDuration || 0) % 60}s
                </div>
                <div className="text-sm font-medium text-red-500">+7%</div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Visit Duration</div>
            </div>
          </div>
        </div>
      </div>
      {/* Chart built with Chart.js 3 */}
      <div className="grow">
        <LineChart03 data={chartData} width={800} height={300} />
      </div>
    </div>
  )
}
