// app/astrology/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { Boundary } from '@/components/ui/boundary';
import Link from 'next/link';
import { combinations } from '../combinations';
  

export async function generateStaticParams() {
  return combinations.map((combo) => ({
    slug: combo.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const combination = combinations.find((c) => c.slug === slug);
  return {
    title: combination ? `${combination.title} | Archetypal Astrology` : 'Combination Not Found',
    description: combination?.description || 'Explore astrological planetary combinations.',
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const combination = combinations.find((c) => c.slug === slug);

  if (!combination) {
    notFound();
  }

  return (
    <Boundary
      label="Archetypal Combination "
      animateRerendering={false}
      kind="solid"
      className="flex flex-col gap-9"
    >
      <div className="max-w-4xl mx-auto">
        <Link href="/astrology" className="text-yellow-700 hover:text-yellow-700 dark:text-yellow-700 dark:hover:text-yellow-700 mb-4 inline-block">
          ← Back to Archive
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {combination.title}
        </h1>
        
        <div className="flex items-center gap-4 mb-6">
          <span className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 px-3 py-1 rounded-full text-sm font-medium">
            {combination.status}
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {combination.category} & {combination.category2}
          </span>
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
            {combination.description}
          </p>

          <h2 className="text-2xl font-semibold mb-4">Evidence</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Coming soon: Detailed evidence supporting this planetary combination theory.
          </p>

          <h2 className="text-2xl font-semibold mb-4">Counterarguments</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Coming soon: Alternative perspectives and counterarguments to this theory.
          </p>

          <h2 className="text-2xl font-semibold mb-4">Current Status</h2>
          <p className="text-gray-600 dark:text-gray-400">
            This combination theory is currently under development. Check back for updates.
          </p>
        </div>
      </div>
    </Boundary>
  );
}