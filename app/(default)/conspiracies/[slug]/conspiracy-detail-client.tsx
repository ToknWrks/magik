// app/(default)/conspiracies/[slug]/conspiracy-detail-client.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Boundary } from '@/components/ui/boundary';

interface Conspiracy {
  id: number;
  title: string;
  description: string;
  content: string;
  status: string;
  category: string;
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

export default function ConspiracyDetailClient({ slug }: { slug: string }) {
  const [conspiracy, setConspiracy] = useState<Conspiracy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    // Fetch conspiracy details
    fetch(`/api/conspiracies/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setConspiracy(data.conspiracy);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching conspiracy:', err);
        setError('Failed to load conspiracy');
        setLoading(false);
      });

    // Fetch store products
    fetch('/api/printful/products')
      .then(res => res.json())
      .then(data => {
        // Get first 3 products for sidebar
        setProducts((data.products || []).slice(0, 3));
        setProductsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching products:', err);
        setProductsLoading(false);
      });
  }, [slug]);

  const getStatusColor = (status: string) => {
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  if (loading) {
    return (
      <Boundary label="Conspiracy Details">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
          <div className="lg:w-64 shrink-0">
            <ProductSidebar products={[]} loading={true} />
          </div>
        </div>
      </Boundary>
    );
  }

  if (error || !conspiracy) {
    return (
      <Boundary label="Conspiracy Details">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error || 'Conspiracy not found'}</p>
          <Link
            href="/conspiracies"
            className="text-gray-600 dark:text-gray-400 hover:underline"
          >
            ← Back to Conspiracies
          </Link>
        </div>
      </Boundary>
    );
  }

  return (
    <Boundary label="Conspiracy Details">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1">
          <Link
            href="/conspiracies"
            className="text-sm text-gray-600 dark:text-gray-400 hover:underline mb-4 inline-block"
          >
            ← Back to Conspiracies
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
              {conspiracy.category}
            </span>
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(conspiracy.status)}`}>
              {conspiracy.status}
            </span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {conspiracy.title}
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            {conspiracy.description}
          </p>

          {/* Content */}
          <div className="prose dark:prose-invert max-w-none">
            {conspiracy.content ? (
              <div dangerouslySetInnerHTML={{ __html: conspiracy.content }} />
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  Detailed analysis coming soon. Check back later for a comprehensive examination of this conspiracy theory.
                </p>
              </div>
            )}
          </div>

          {/* Related Conspiracies or Share Section */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Share This Analysis
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied!');
                }}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
              >
                Copy Link
              </button>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(conspiracy.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
              >
                Share on X
              </a>
            </div>
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

            {/* Table of Contents or Quick Links */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Quick Links
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/conspiracies" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                    All Conspiracies
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/store" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                    Store
                  </Link>
                </li>
              </ul>
            </div>

            {/* Newsletter CTA */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Stay Informed
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Get updates on new conspiracy analyses.
              </p>
              <Link
                href="/signup"
                className="block text-center py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Boundary>
  );
}