// app/lance-pitman/page.tsx
import { Metadata } from 'next';
import LancePitman from './lance-pitman';

// Metadata for SEO
export const metadata: Metadata = {
  title: 'Lance Pitman - Archetypal Astrology Lectures | Real Illuminati',
  description: 'Explore comprehensive video lectures on archetypal astrology by Lance Pitman. Learn about planetary combinations, practical applications, and real-world case studies in depth.',
  keywords: ['archetypal astrology', 'lance pitman', 'planetary combinations', 'astrology lectures', 'spiritual development'],
  openGraph: {
    title: 'Lance Pitman - Archetypal Astrology Lectures',
    description: 'Comprehensive video series exploring archetypal astrology principles and planetary combinations.',
    type: 'website',
    images: [
      {
        url: '/images/astrology-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Lance Pitman Archetypal Astrology'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lance Pitman - Archetypal Astrology Lectures',
    description: 'Comprehensive video series exploring archetypal astrology principles and planetary combinations.',
    images: ['/images/astrology-og.jpg']
  }
};

export default function LancePitmanPage() {
  return <LancePitman />;
}