// app/articles/page.tsx
import Link from 'next/link';
import { getArticles } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const articles = await getArticles();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Articles</h1>
      <ul>
        {articles.map(article => (
          <li key={article.id}>
            <Link href={`/articles/${article.slug}`}>
              {article.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
