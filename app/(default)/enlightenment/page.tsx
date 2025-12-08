// app/(default)/enlightenment/page.tsx
import { getAllEnlightenmentTemplates } from '@/lib/db';
import EnlightenmentClient from './enlightenment-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Enlightenment - Spiritual Teachings',
  description: 'Explore spiritual teachings, wisdom traditions, and practices for inner growth.',
};

export default async function Page() {
  const teachings = await getAllEnlightenmentTemplates();
  
  return <EnlightenmentClient teachings={teachings} />;
}