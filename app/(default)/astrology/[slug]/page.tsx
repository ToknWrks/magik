// app/astrology/[slug]/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import { AstrologyContent } from './astrology-content';
import { getAstrologyTemplate } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Boundary } from '@/components/ui/boundary';
import Link from 'next/link';
import { combinations } from '../combinations';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return combinations.map((combo) => ({
    slug: combo.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const template = await getAstrologyTemplate(slug);
  
  return {
    title: template?.title || 'Astrological Combination',
    description: template?.description || `Explore the ${template?.title} planetary combination in archetypal astrology`,
  };
}

export default async function AstrologyPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <Suspense fallback={
      <div className="animate-pulse p-8">
        <div className="h-8 bg-yellow-200 dark:bg-yellow-900/30 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-8"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    }>
      <AstrologyContent slug={slug} />
    </Suspense>
  );
}