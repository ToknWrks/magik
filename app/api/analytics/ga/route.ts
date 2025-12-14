// app/api/analytics/ga4/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GA_CLIENT_EMAIL,
    private_key: process.env.GA_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '30daysAgo';
  const metric = searchParams.get('metric') || 'activeUsers';

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA_PROPERTY_ID}`,
      dateRanges: [{ startDate: period, endDate: 'today' }],
      dimensions: [
        { name: 'date' },
        { name: 'sessionDefaultChannelGrouping' },
        { name: 'landingPage' },
      ],
      metrics: [
        { name: metric },
        { name: 'sessions' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
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

    // Transform GA4 data to your dashboard format
    const transformedData = {
      rows: response.rows?.map(row => ({
        date: row.dimensionValues?.[0]?.value,
        channel: row.dimensionValues?.[1]?.value,
        page: row.dimensionValues?.[2]?.value,
        value: parseInt(row.metricValues?.[0]?.value || '0'),
        sessions: parseInt(row.metricValues?.[1]?.value || '0'),
        bounceRate: parseFloat(row.metricValues?.[2]?.value || '0') * 100,
        avgDuration: parseFloat(row.metricValues?.[3]?.value || '0'),
      })) || [],
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('GA4 API error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}