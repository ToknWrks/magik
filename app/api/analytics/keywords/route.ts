// app/api/analytics/keywords/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GA_CLIENT_EMAIL,
    private_key: process.env.GA_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

export async function GET(request: NextRequest) {
  try {
    // GA4 doesn't provide actual search keywords due to privacy
    // But we can get organic search sessions by landing page
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA_PROPERTY_ID}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [
        { name: 'landingPage' },
        { name: 'sessionDefaultChannelGrouping' },
      ],
      metrics: [
        { name: 'sessions' },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'sessionDefaultChannelGrouping',
          stringFilter: {
            matchType: 'EXACT',
            value: 'Organic Search',
          },
        },
      },
      orderBys: [
        {
          metric: { metricName: 'sessions' },
          desc: true,
        },
      ],
      limit: 20,
    });

    // Since GA4 doesn't provide keywords, we'll show landing pages from organic search
    const keywords = response.rows?.map(row => ({
      keyword: `Organic search → ${row.dimensionValues?.[0]?.value || 'Unknown page'}`,
      sessions: parseInt(row.metricValues?.[0]?.value || '0'),
    })) || [];

    return NextResponse.json({ keywords });
  } catch (error) {
    console.error('GA4 Keywords API error:', error);
    return NextResponse.json({ keywords: [] });
  }
}