// app/conspiracies/[slug]/conspiracy-content.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Boundary } from '@/components/ui/boundary';
import { ConspiracySkeleton } from '@/components/ui/conspiracy-skeleton';
import ReactMarkdown from 'react-markdown';
import BgImage from './bg-image';

interface ConspiracyContentProps {
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
}

function ProductSidebar({ products, loading }: { products: Product[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {products.map(product => (
        <Link
          key={product.id}
          href={`/store/product/${product.slug}`}
          className="block group"
        >
          <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-2">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-gray-600 dark:group-hover:text-gray-300 line-clamp-2">
            {product.name}
          </h4>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
            ${product.price.toFixed(2)}
          </p>
        </Link>
      ))}
    </div>
  );
}

export function ConspiracyContent({ slug }: ConspiracyContentProps) {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useManual, setUseManual] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    generateContent();
  }, [slug, useManual]);

  // Fetch products separately - non-blocking
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/printful/products');
        
        if (!res.ok) {
          console.warn('Products API returned:', res.status);
          setProductsLoading(false);
          return;
        }
        
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('Products API returned non-JSON');
          setProductsLoading(false);
          return;
        }
        
        const data = await res.json();
        setProducts((data.products || []).slice(0, 3));
      } catch (err) {
        console.warn('Error fetching products:', err);
      } finally {
        setProductsLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  const generateContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if template has manual content
      const templateResponse = await fetch(`/api/conspiracies/template/${slug}`);
      const template = await templateResponse.json();

      // Check if active
      if (!template.is_active) {
        setError('This conspiracy template is not active.');
        return;
      }

      // Then check content type
      if (template.content_type === 'manual' && template.article_content) {
        // Use manual content
        setContent({
          title: template.title,
          body: template.article_content,
          debunking: template.debunking_points?.join('\n'),
          sources: template.sources,
        });
        return;
      } else {
        // Generate AI content
        const response = await fetch(`/api/conspiracies/generate/${slug}`, {
          method: 'POST',
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        let content = data;
        if (data.cached) {
          try {
            const parsed = JSON.parse(data.body);
            content = { ...data, body: parsed.body, title: parsed.title, sources: parsed.sources };
          } catch (e) {
            // If not JSON, use as is
          }
        }

        setContent(content);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const postToTwitter = () => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/conspiracies/${slug}`;
    const text = `${content.title} ${url} #realilluminati`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <ConspiracySkeleton />
        </div>
        <div className="lg:w-64 shrink-0">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <ProductSidebar products={[]} loading={true} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <Boundary label="Error">
            <div className="text-red-600 dark:text-red-400">
              {error}
            </div>
          </Boundary>
        </div>
        <div className="lg:w-64 shrink-0">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">From Our Store</h3>
            <ProductSidebar products={products} loading={productsLoading} />
          </div>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <Boundary label="No Content">
        <div className="text-gray-600 dark:text-gray-400">
          No content available.
        </div>
      </Boundary>
    );
  }

  return (
    <Boundary label="Conspiracy Theory">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1 relative">
          <BgImage />
          <div className="relative z-10">
            {/* Twitter Icon */}
            <div className="absolute top-4 right-4">
              <button
                onClick={postToTwitter}
                className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                title="Share on Twitter"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {content.title || 'Generated Conspiracy'}
            </h1>
            
            <div className="prose prose-gray dark:text-gray-400 max-w-none">
              <ReactMarkdown>{content.content || content.body || ''}</ReactMarkdown>
            </div>

            {content.debunking && (
              <>
                <hr className="my-8 border-gray-300 dark:border-gray-600" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Reality Check
                </h2>
                <div className="prose prose-gray dark:text-yellow-700 max-w-none">
                  <ReactMarkdown>{content.debunking || ''}</ReactMarkdown>
                </div>
              </>
            )}

            {content.sources && content.sources.length > 0 && (
              <>
                <hr className="my-8 border-gray-300 dark:border-gray-600" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Sources
                </h2>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  {content.sources.map((source: string, index: number) => (
                    <li key={index}>{source}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-64 shrink-0">
          <div className="sticky top-4 space-y-4">
            {/* Store Products */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  From Our Store
                </h3>
                <Link
                  href="/store"
                  className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
                >
                  View All →
                </Link>
              </div>
              
              <ProductSidebar products={products} loading={productsLoading} />
              
              {!productsLoading && products.length > 0 && (
                <Link
                  href="/store"
                  className="block mt-4 text-center py-2 px-4 bg-gray-800 text-white rounded hover:bg-gray-900 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-100 text-sm font-medium"
                >
                  Browse Store
                </Link>
              )}
            </div>

            {/* Quick Links */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Explore More
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/conspiracies" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                    ← All Conspiracies
                  </Link>
                </li>
                <li>
                  <Link href="/real/illuminati-history" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                    About Illuminati
                  </Link>
                </li>
                <li>
                  <Link href="/store" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                    Store
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Boundary>
  );
}