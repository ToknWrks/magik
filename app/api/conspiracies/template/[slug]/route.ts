// app/api/conspiracies/template/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getConspiracyTemplate } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const template = await getConspiracyTemplate(slug);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    return NextResponse.json(template);
  } catch (error) {
    console.error('Template fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch template' 
    }, { status: 500 });
  }
}