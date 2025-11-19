// app/articles/[slug]/page.tsx
import { Metadata } from 'next';
import ArticleClient from '../article-client';
import { getArticle } from '@/lib/db';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  return {
    title: article?.title || 'Article',
    description: article?.excerpt || 'Article description',
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return <div>Article not found</div>;
  }

  return <ArticleClient article={article} />;
}