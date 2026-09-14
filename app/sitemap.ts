// app/sitemap.ts
import {
  getAllArticles,
  getAllConspiracyTemplates,
  getAllEnlightenmentTemplates,
  getAllAstrologyTemplates,
} from '@/lib/db';
import { amazonProducts } from '@/lib/amazon-products';
import { MetadataRoute } from 'next';

const baseUrl = 'https://illuminati.co';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static public pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/landing`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/real`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/astrology`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/astrology/personal-reading`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/conspiracies`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/mysteries`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/mysteries/illuminati-history`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/enlightenment`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/enlightenment/5-minute-meditation`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/enlightenment/20-minute-meditation`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/spirit-voices`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/chakra-toner`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/store`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/articles`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/credits`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/signin`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/utility/faqs`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/utility/roadmap`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/utility/changelog`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  // Dynamic routes from DB — skip gracefully at build time when DB is unavailable
  let articles: Awaited<ReturnType<typeof getAllArticles>> = [];
  let conspiracyTemplates: Awaited<ReturnType<typeof getAllConspiracyTemplates>> = [];
  let enlightenmentTemplates: Awaited<ReturnType<typeof getAllEnlightenmentTemplates>> = [];
  let astrologyTemplates: Awaited<ReturnType<typeof getAllAstrologyTemplates>> = [];

  if (process.env.DATABASE_URL) {
    try {
      [articles, conspiracyTemplates, enlightenmentTemplates, astrologyTemplates] =
        await Promise.all([
          getAllArticles(),
          getAllConspiracyTemplates(),
          getAllEnlightenmentTemplates(),
          getAllAstrologyTemplates(),
        ]);
    } catch {
      // DB unavailable at build time — sitemap will be populated at runtime
    }
  }

  const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${baseUrl}/articles/${a.slug}`,
    lastModified: a.published_at ? new Date(a.published_at) : now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const conspiracyRoutes: MetadataRoute.Sitemap = conspiracyTemplates.map((t) => ({
    url: `${baseUrl}/conspiracies/${t.slug}`,
    lastModified: t.created_at ? new Date(t.created_at) : now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const mysteryRoutes: MetadataRoute.Sitemap = conspiracyTemplates.map((t) => ({
    url: `${baseUrl}/mysteries/${t.slug}`,
    lastModified: t.created_at ? new Date(t.created_at) : now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const enlightenmentRoutes: MetadataRoute.Sitemap = enlightenmentTemplates.map((t) => ({
    url: `${baseUrl}/enlightenment/${t.slug}`,
    lastModified: t.created_at ? new Date(t.created_at) : now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const astrologyRoutes: MetadataRoute.Sitemap = astrologyTemplates.map((t) => ({
    url: `${baseUrl}/astrology/${t.slug}`,
    lastModified: t.created_at ? new Date(t.created_at) : now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Amazon product pages
  const amazonRoutes: MetadataRoute.Sitemap = amazonProducts.map((p) => ({
    url: `${baseUrl}/store/product/${p.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Printful product pages
  const printfulRoutes: MetadataRoute.Sitemap = [];
  try {
    const response = await fetch(`${baseUrl}/api/printful/products`);
    if (response.ok) {
      const data = await response.json();
      data.products?.forEach((p: { slug: string }) => {
        printfulRoutes.push({
          url: `${baseUrl}/store/product/${p.slug}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      });
    }
  } catch (error) {
    console.error('Error fetching Printful products for sitemap:', error);
  }

  return [
    ...staticRoutes,
    ...articleRoutes,
    ...conspiracyRoutes,
    ...mysteryRoutes,
    ...enlightenmentRoutes,
    ...astrologyRoutes,
    ...amazonRoutes,
    ...printfulRoutes,
  ];
}
