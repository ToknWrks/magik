// app/api/leads/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { searchAndImportLeads, LEAD_KEYWORDS } from '@/lib/x-leads';

export const maxDuration = 300; // seconds — grok-4 with live x_search is slow

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const keyword: string = body.keyword || LEAD_KEYWORDS[Math.floor(Math.random() * LEAD_KEYWORDS.length)];
    const maxResults: number = Math.min(body.max_results || 20, 100);
    const minScore: number = body.min_score ?? 40;

    const result = await searchAndImportLeads(keyword, maxResults, minScore);

    return NextResponse.json({
      success: true,
      keyword,
      imported: result.imported,
      skipped: result.skipped,
      duplicates: result.duplicates,
      lowScore: result.lowScore,
      grokFound: result.grokFound,
      rawSample: result.rawSample,
    });
  } catch (error) {
    console.error('Lead search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 },
    );
  }
}
