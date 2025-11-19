// app/api/admin/articles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { insertArticle, getArticles, updateArticle, deleteArticle } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const articles = await getArticles();
    console.log('Articles fetched:', articles);  // Add logging
    return NextResponse.json({ articles });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const article = await insertArticle({
    title: data.title,
    slug: data.slug,
    content: data.content,
    pre_summary: data.pre_summary,
    post_summary: data.post_summary,
    status: data.status,
    category: data.category,
  });
  return NextResponse.json({ article });
}

export async function PUT(request: NextRequest) {
  const data = await request.json();
  const article = await updateArticle(data.id, {
    title: data.title,
    slug: data.slug,
    content: data.content,
    pre_summary: data.pre_summary,
    post_summary: data.post_summary,
    status: data.status,
    category: data.category,
  });
  return NextResponse.json({ article });
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  await deleteArticle(id);
  return NextResponse.json({ success: true });
}