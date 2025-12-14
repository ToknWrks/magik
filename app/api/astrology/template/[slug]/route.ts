// app/api/astrology/template/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAstrologyTemplate } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const template = await getAstrologyTemplate(slug);

    if (!template) {
      return NextResponse.json({ error: 'Astrology combination not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Astrology template error:', error);
    return NextResponse.json({ error: 'Failed to fetch astrology combination' }, { status: 500 });
  }
}