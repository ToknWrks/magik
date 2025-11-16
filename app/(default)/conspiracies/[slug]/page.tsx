// app/conspiracies/[slug]/page.tsx
import { Metadata } from 'next';
import { Suspense, use } from 'react';
import { ArticleDebate } from '@/components/ArticleDebate';
import { getConspiracyTemplate } from '@/lib/db';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const template = await getConspiracyTemplate(slug);
  
  return {
    title: template?.title || 'Conspiracy Theory',
    description: `Explore and debate the ${template?.title || 'conspiracy theory'} with AI.`,
  };
}

function ConspiracyPageContent({ slug }: { slug: string }) {
  // This will be called within Suspense
  const template = use(getConspiracyTemplate(slug));

  if (!template) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400">
          The requested conspiracy theory article could not be found.
        </p>
      </div>
    );
  }

  return (
    <ArticleDebate 
      articleId={template.id}
      articleContent={template.article_content || 'Article content coming soon...'}
      articleTitle={template.title}
    />
  );
}

export default function ConspiracyPage({ params }: PageProps) {
  const { slug } = use(params);

  return (
    <Suspense fallback={
      <div className="animate-pulse p-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-8"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    }>
      <ConspiracyPageContent slug={slug} />
    </Suspense>
  );
}