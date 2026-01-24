// app/sitemap.ts
import { amazonProducts } from '@/lib/amazon-products';
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://illuminati.earth';

  const sitemapEntries: MetadataRoute.Sitemap = [
  // ... existing sitemap entries ...
  ];

  // Add product pages
  amazonProducts.forEach((product) => {
    sitemapEntries.push({
      url: `${baseUrl}/store/product/${product.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  });

  // Add Printful products (fetch from API)
  try {
    const response = await fetch(`${baseUrl}/api/printful/products`);
    if (response.ok) {
      const data = await response.json();
      data.products?.forEach((product: any) => {
        sitemapEntries.push({
          url: `${baseUrl}/store/product/${product.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      });
    }
  } catch (error) {
    console.error('Error fetching products for sitemap:', error);
  }

  return sitemapEntries;
}