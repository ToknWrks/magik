// app/astrology/[slug]/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import { AstrologyContent } from './astrology-content';
import { getAstrologyTemplate } from '@/lib/db';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  // This will be populated from your combinations data
  return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const template = await getAstrologyTemplate(slug);

  if (!template) {
    return {
      title: 'Astrological Combination Not Found | Archetypal Astrology | Real Illuminati',
      description: 'The requested astrological combination could not be found. Explore our comprehensive collection of planetary combinations and archetypal astrology insights.',
      keywords: ['archetypal astrology', 'planetary combinations', 'astrology', 'spiritual development'],
    };
  }

  const title = `${template.title} Transit - Archetypal Astrology | Illuminati `;
  const description = template.description || `Explore the ${template.title} planetary combination in archetypal astrology. Understand the fundamental energies between ${template.category} and ${template.category2} and their manifestation in personality, relationships, and life events.`;
  
  const keywords = [
    'archetypal astrology',
    'planetary combinations',
    template.category,
    template.category2,
    'astrology',
    'spiritual development',
    'psychological astrology',
    'mythic astrology',
    'jungian astrology',
    'planets',
    'zodiac',
    'horoscope'
  ];

  return {
    title,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: 'Real Illuminati' }],
    creator: 'Real Illuminati',
    publisher: 'Real Illuminati',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL('https://illuminati.co'),
    alternates: {
      canonical: `https://illuminati.co/astrology/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://illuminati.co/astrology/${slug}`,
      siteName: 'Real Illuminati',
      locale: 'en_US',
      type: 'article',
      publishedTime: template.created_at?.toISOString(),
      modifiedTime: template.updated_at?.toISOString(),
      authors: ['Real Illuminati'],
      tags: keywords,
      images: [
        {
          url: `https://illuminati.co/api/og/astrology/${slug}`,
          width: 1200,
          height: 630,
          alt: `${template.title} - Archetypal Astrology`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`https://illuminati.co/api/og/astrology/${slug}`],
      creator: '@realilluminati',
      site: '@realilluminati',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: 'your-google-verification-code',
    },
    category: 'Astrology',
  };
}

export default async function AstrologyPage({ params }: PageProps) {
  const { slug } = await params;
  const template = await getAstrologyTemplate(slug);

  if (!template) {
    notFound();
  }

  return (
    <Suspense fallback={
      <div className="animate-pulse p-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    }>
      <AstrologyContent slug={slug} />
    </Suspense>
  );
}