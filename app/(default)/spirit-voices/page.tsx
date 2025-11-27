// app/store/page.tsx
import { Metadata } from 'next';
import { StoreClient } from './spirit-client';

export const metadata: Metadata = {
  title: 'Spirit Voices | Illuminati',
  description: 'An ode to the spirits that guide us through the shadows of conspiracy and truth.',
  keywords: ['illuminati spirits', 'hakuin zenji', 'zen illuminati', 'spirit voices', 'mystical insights', 'conspiracy wisdom'],
  openGraph: {
    title: 'Illuminati Store',
    description: 'Official merchandise and collectibles.',
    type: 'website',
  },
};

export default function StorePage() {
  return <StoreClient />;
}