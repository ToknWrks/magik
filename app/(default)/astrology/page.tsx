// app/astrology/page.tsx
import { getAllAstrologyTemplates } from '@/lib/db';
import AstrologyClient from './astrology-client'; // Make sure this matches the export
import { Metadata } from 'next';
// Force dynamic rendering
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Archetypal Astrology | Illuminati',
  description: 'Explore archetypal astrology combinations, planetary pairs, and their meanings. A comprehensive guide to understanding astrological influences and symbolism.',
  keywords: ['archetypal astrology', 'planetary pairs', 'astrological combinations', 'astrology guide'],
  openGraph: {
    title: 'Archetypal Astrology Guide',
    description: 'Explore archetypal astrology combinations and planetary pairs.',
    type: 'website',
  },
};

export default async function Page() {
  const combinations = await getAllAstrologyTemplates();
  
  return <AstrologyClient combinations={combinations} />;
}