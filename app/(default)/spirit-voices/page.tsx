// app/store/page.tsx
import { Metadata } from 'next';
import { StoreClient } from './spirit-client';

export const metadata: Metadata = {
  title: 'Illuminati Store | Official Merchandise',
  description: 'Shop official Illuminati merchandise, books, apparel, and conspiracy theory collectibles.',
  keywords: ['illuminati store', 'conspiracy merchandise', 'illuminati apparel', 'conspiracy books'],
  openGraph: {
    title: 'Illuminati Store',
    description: 'Official merchandise and collectibles.',
    type: 'website',
  },
};

export default function StorePage() {
  return <StoreClient />;
}