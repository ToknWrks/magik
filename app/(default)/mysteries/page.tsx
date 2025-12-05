// app/(default)/mysteries/page.tsx
import { getAllConspiracyTemplates } from '@/lib/db';
import MysteryClient from './mystery-client';

export const metadata = {
  title: 'Mysteries Archive - Illuminati',
  description: 'Explore documented mysteries, unexplained phenomena, and historical enigmas.',
};

export default async function Page() {
  const articles = await getAllConspiracyTemplates();
  
  return <MysteryClient articles={articles} />;
}