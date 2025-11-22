import Link from 'next/link';
import { getAllConspiracyTemplates } from '@/lib/db';

export default async function Page() {
  const articles = await getAllConspiracyTemplates();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Illuminati Mysteries</h1>
      <ul>
        {articles.map(article => (
          <li key={article.id}>
            <Link href={`/mysteries/${article.slug}`}>
              {article.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}