// app/lance-pitman/page.tsx
import { Metadata } from 'next';
import LancePitman from './lance-pitman';

// Metadata for SEO
export const metadata: Metadata = {
  title: 'Lance Pitman - Snowboard Video Parts | Real Illuminati',
  description: 'Lance Pitmans snowboarding video parts from early k2 days to illuminati snowboards.',
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