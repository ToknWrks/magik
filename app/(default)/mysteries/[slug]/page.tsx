// app/(default)/mysteries/[slug]/page.tsx
import { Metadata } from 'next';
import { getConspiracyTemplate } from '@/lib/db';
import { notFound } from 'next/navigation';
import { MysteryContent } from './mystery-content'; // Adjusted the path to match the expected structure

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  // This will be populated from your mystery templates
  return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const template = await getConspiracyTemplate(slug);

  if (!template) {
    return {
      title: 'Mystery Not Found | Real Illuminati',
      description: 'The requested mystery could not be found. Explore our comprehensive collection of documented mysteries, unexplained phenomena, and historical enigmas.',
      keywords: ['mysteries', 'conspiracy theories', 'unexplained phenomena', 'historical enigmas'],
      metadataBase: new URL('https://illuminati.co'),
      alternates: {
        canonical: `/mysteries/${slug}`,
      },
    };
  }

  const title = `${template.title} - Illuminati Mysteries`;
  const description = template.description || `Explore the mystery of ${template.title}. Uncover the facts, evidence, and critical analysis surrounding this intriguing phenomenon.`;
  
  const keywords = [
    'mysteries',
    'conspiracy theories',
    'unexplained phenomena',
    'historical enigmas',
    'documented mysteries',
    template.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(' ').slice(0, 3).join(' '),
    'illuminati',
    'truth',
    'conspiracy'
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
      canonical: `/mysteries/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/mysteries/${slug}`,
      siteName: 'Real Illuminati',
      locale: 'en_US',
      type: 'article',
      publishedTime: template.created_at,
      modifiedTime: template.updated_at,
      authors: ['Real Illuminati'],
      tags: keywords,
      images: [
        {
          url: `/api/og/mysteries/${slug}`,
          width: 1200,
          height: 630,
          alt: `${template.title} - Mysteries Archive`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/api/og/mysteries/${slug}`],
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
  };
}

export default async function MysteryPage({ params }: PageProps) {
  const { slug } = await params;
  const template = await getConspiracyTemplate(slug);

  if (!template) {
    notFound();
  }

  return <MysteryContent slug={slug} />;
}