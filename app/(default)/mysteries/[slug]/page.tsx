// app/conspiracies/[slug]/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import { ConspiracyContent } from './mystery-content';
import { getConspiracyTemplate } from '@/lib/db';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const template = await getConspiracyTemplate(slug);
  
  return {
    title: template?.title || 'Conspiracy Theory',
    description: `Explore and debate the ${template?.title || 'conspiracy theory'} with AI.`,
  };
}

export default async function ConspiracyPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <Suspense fallback={
      <div className="animate-pulse p-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-8"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    }>
      <ConspiracyContent slug={slug} />
    </Suspense>
  );
}