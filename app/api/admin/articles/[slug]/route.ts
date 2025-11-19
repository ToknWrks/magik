// app/api/admin/articles/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getArticleBySlug } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }
  return NextResponse.json({ article });
}