// app/astrology/page.tsx
import { getAllAstrologyTemplates } from '@/lib/db';
import AstrologyClient from './astrology-client'; // Make sure this matches the export

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function Page() {
  const combinations = await getAllAstrologyTemplates();
  
  return <AstrologyClient combinations={combinations} />;
}