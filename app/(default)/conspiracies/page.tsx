// app/conspiracies/page.tsx
import { Metadata } from 'next';
import { ConspiraciesClient } from './conspiracies-client';

export const metadata: Metadata = {
  title: 'Conspiracy Theories Archive | Illuminati',
  description: 'Explore documented conspiracy theories, debunked myths, and historical conspiracies. A comprehensive archive of conspiracy theories from ancient times to modern day.',
  keywords: ['conspiracy theories', 'illuminati', 'secret societies', 'historical conspiracies'],
  openGraph: {
    title: 'Conspiracy Theories Archive',
    description: 'Explore documented conspiracy theories and debunked myths.',
    type: 'website',
  },
};

export default function ConspiraciesPage() {
  return <ConspiraciesClient />;
}