// app/(default)/store/store-client.tsx
'use client';

import { useState, useEffect } from 'react';
import { Boundary } from '@/components/ui/boundary';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { amazonProducts, amazonCategories, AmazonProduct } from '@/lib/amazon-products';

interface PrintfulProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image?: string;
  featured?: boolean;
  inStock: boolean;
  sizes: string[];
  colors: string[];
  variants: any[];
}

interface DisplayProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  image: string;
  featured?: boolean;
  isAmazon?: boolean;
  amazonUrl?: string;
  inStock?: boolean;
  sizes?: string[];
  colors?: string[];
  variants?: any[];
}

function ProductSkeleton() {
  return (
    <div className="group flex flex-col gap-4 rounded-lg bg-gray-50 dark:bg-gray-900 px-6 py-6 animate-pulse">
      <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      <div className="flex items-center gap-2">
        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
      <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
      <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
    </div>
  );
}

export function StoreClient() {
  const [printfulProducts, setPrintfulProducts] = useState<PrintfulProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Clothing');
  const [sortBy, setSortBy] = useState<string>('featured');
  const { itemCount, total } = useCart();

  useEffect(() => {
    fetch('/api/printful/products')
      .then(res => res.json())
      .then(data => {
        // Set all Printful products to "Clothing" category
        const clothingProducts = (data.products || []).map((p: PrintfulProduct) => ({
          ...p,
          category: 'Clothing',
        }));
        setPrintfulProducts(clothingProducts);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching products:', error);
        setLoading(false);
      });
  }, []);

  // Combine Printful and Amazon products
  const allProducts: DisplayProduct[] = [
    ...printfulProducts.map(p => ({
      ...p,
      image: p.image || '',
      isAmazon: false,
    })),
    ...amazonProducts.map(p => ({
      ...p,
      isAmazon: true,
      inStock: true,
    })),
  ];

  // Get unique categories
  const categories = ['All', 'Clothing', ...amazonCategories];

  const filteredProducts = allProducts
    .filter(product => {
      return selectedCategory === 'All' || product.category === selectedCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'featured':
        default:
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      }
    });

  return (
    <Boundary
      label="Illuminati Store"
      animateRerendering={false}
      kind="solid"
      className="flex flex-col gap-9"
    >
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
          Premium merchandise, books, and gear for the enlightened mind.
          
        </p>

        {/* Filters and Sort */}
        {!loading && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <div className="flex gap-2 flex-wrap justify-center">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name</option>
            </select>
          </div>
        )}
      </div>

      {/* Skeleton Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <ProductSkeleton key={index} />
          ))}
        </div>
      )}

      {/* Products Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Link
              href={product.isAmazon ? `/store/product/${product.slug}` : `/store/product/${product.slug}`}
              key={product.id}
              className="group flex flex-col gap-4 rounded-lg bg-gray-50 px-6 py-6 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 transition-all duration-200 hover:shadow-lg"
            >
              <div className="relative">
                <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  <img
                    src={product.image || '/api/placeholder/300/300'}
                    alt={product.name}
                    className={`w-full h-full rounded-lg ${product.isAmazon ? 'object-contain p-2' : 'object-cover'}`}
                  />
                </div>
                
                {product.featured && (
                  <span className="absolute top-2 left-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                    Featured
                  </span>
                )}

                {product.isAmazon && (
                  <span className="absolute top-2 right-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200">
                    Partner
                  </span>
                )}
                
                {!product.isAmazon && product.inStock === false && (
                  <span className="absolute top-2 right-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200">
                    Out of Stock
                  </span>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                    {product.category}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {product.name}
                </h3>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {product.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    ${product.price.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                View Details →
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No products found in this category.
          </p>
        </div>
      )}

      {/* Floating Cart Summary */}
      {itemCount > 0 && (
        <Link
          href="/cart"
          className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg dark:bg-gray-200 dark:text-gray-900 hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors flex items-center gap-3"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span className="font-medium">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
          <span className="font-bold">${total.toFixed(2)}</span>
        </Link>
      )}
    </Boundary>
  );
}