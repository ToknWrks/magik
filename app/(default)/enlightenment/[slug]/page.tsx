// app/(default)/enlightenment/[slug]/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import { EnlightenmentContent } from './enlightenment-content';
import { getEnlightenmentTemplate } from '@/lib/db';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const template = await getEnlightenmentTemplate(slug);
  
  return {
    title: template?.title || 'Spiritual Teaching',
    description: template?.description || `Explore the spiritual teaching: ${template?.title}`,
  };
}

export default async function EnlightenmentPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <Suspense fallback={
      <div className="animate-pulse p-8">
        <div className="h-8 bg-purple-200 dark:bg-purple-900/30 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-8"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    }>
      <EnlightenmentContent slug={slug} />
    </Suspense>
  );
}