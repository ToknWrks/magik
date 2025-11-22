// app/store/store-client.tsx
'use client';

import { useState } from 'react';
import { Boundary } from '@/components/ui/boundary';
import Link from 'next/link';

// Mock store data - replace with your actual products
const products = [
  {
    id: 1,
    name: "Illuminati Hoodie",
    price: 49.99,
    originalPrice: 69.99,
    category: "Apparel",
    image: "/api/placeholder/300/300",
    description: "Premium cotton hoodie with subtle Illuminati symbolism",
    inStock: true,
    featured: true
  },
  {
    id: 2,
    name: "Conspiracy Theories: The Complete Guide",
    price: 24.99,
    category: "Books",
    image: "/api/placeholder/300/300",
    description: "Comprehensive guide to major conspiracy theories throughout history",
    inStock: true,
    featured: false
  },
  {
    id: 3,
    name: "Illuminati Symbol T-Shirt",
    price: 29.99,
    category: "Apparel",
    image: "/api/placeholder/300/300",
    description: "Classic black t-shirt with gold foil Illuminati pyramid",
    inStock: true,
    featured: true
  },
  {
    id: 4,
    name: "Secret Societies Coffee Table Book",
    price: 39.99,
    originalPrice: 49.99,
    category: "Books",
    image: "/api/placeholder/300/300",
    description: "Beautifully illustrated book exploring secret societies worldwide",
    inStock: false,
    featured: false
  },
  {
    id: 5,
    name: "Illuminati Baseball Cap",
    price: 34.99,
    category: "Accessories",
    image: "/api/placeholder/300/300",
    description: "Adjustable cap with embroidered Illuminati eye symbol",
    inStock: true,
    featured: false
  },
  {
    id: 6,
    name: "Conspiracy Theory Playing Cards",
    price: 19.99,
    category: "Games",
    image: "/api/placeholder/300/300",
    description: "Deck of cards featuring conspiracy theory illustrations",
    inStock: true,
    featured: true
  }
];

export function StoreClient() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('featured');

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(product => {
    return selectedCategory === 'All' || product.category === selectedCategory;
  }).sort((a, b) => {
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
          Official Store
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
          Premium merchandise, books, and collectibles for the enlightened mind.
          All proceeds support conspiracy theory research and education.
        </p>

        {/* Filters and Sort */}
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="group flex flex-col gap-4 rounded-lg bg-gray-50 px-6 py-6 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 transition-all duration-200 hover:shadow-lg"
          >
            <div className="relative">
              <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-gray-400 dark:text-gray-500 text-sm">Product Image</span>
              </div>
              
              {product.featured && (
                <span className="absolute top-2 left-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  Featured
                </span>
              )}
              
              {!product.inStock && (
                <span className="absolute top-2 right-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
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
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    ${product.price}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-gray-500 line-through dark:text-gray-400">
                      ${product.originalPrice}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              disabled={!product.inStock}
              className={`w-full py-2 px-4 rounded text-sm font-medium transition-colors ${
                product.inStock
                  ? 'bg-gray-800 text-white hover:bg-gray-900 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-100'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {product.inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No products found in this category.
          </p>
        </div>
      )}

      {/* Cart Summary (placeholder) */}
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg dark:bg-gray-200 dark:text-gray-900">
        Cart: 0 items
      </div>
    </Boundary>
  );
}