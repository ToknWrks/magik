// app/(default)/store/product/[slug]/product-detail.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Boundary } from '@/components/ui/boundary';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';

interface Variant {
  id: string;
  name: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  currency: string;
  image: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  inStock: boolean;
  sizes: string[];
  colors: string[];
  variants: Variant[];
}

function ProductDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto animate-pulse">
      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="flex flex-col gap-6">
          <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-10 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div>
            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 w-14 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
          <div>
            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
          <div className="h-14 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    fetch('/api/printful/products')
      .then(res => res.json())
      .then(data => {
        const foundProduct = data.products?.find((p: any) => p.slug === slug);
        if (foundProduct) {
          setProduct(foundProduct);
          if (foundProduct.sizes?.length > 0) {
            setSelectedSize(foundProduct.sizes[0]);
          }
          if (foundProduct.colors?.length > 0) {
            setSelectedColor(foundProduct.colors[0]);
          }
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching product:', error);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (product && (selectedSize || selectedColor)) {
      const variant = product.variants?.find(v => {
        const sizeMatch = !selectedSize || v.size === selectedSize;
        const colorMatch = !selectedColor || v.color === selectedColor;
        return sizeMatch && colorMatch;
      });
      
      if (variant) {
        setSelectedVariant(variant);
      } else if (product.variants?.length > 0) {
        setSelectedVariant(product.variants[0]);
      }
    }
  }, [product, selectedSize, selectedColor]);

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;

    addItem({
      id: `${product.id}-${selectedSize}-${selectedColor}`,
      productId: product.id,
      name: product.name,
      size: selectedSize,
      color: selectedColor,
      price: selectedVariant.price,
      quantity: 1,
      image: product.image, // Always use main product image for cart
      variantId: selectedVariant.id,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (loading) {
    return (
      <Boundary label="Product Details">
        <ProductDetailSkeleton />
      </Boundary>
    );
  }

  if (!product) {
    return (
      <Boundary label="Product Details">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Product not found.</p>
          <Link
            href="/store"
            className="text-gray-800 dark:text-gray-200 hover:underline"
          >
            ← Back to Store
          </Link>
        </div>
      </Boundary>
    );
  }

  const displayPrice = selectedVariant?.price || product.price;

  return (
    <Boundary label="Product Details">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/store"
          className="text-sm text-gray-600 dark:text-gray-400 hover:underline mb-6 inline-block"
        >
          ← Back to Store
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image - Always use main product image like store page */}
          <div className="relative">
            <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={product.image || '/api/placeholder/300/300'}
                alt={product.name}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col gap-6">
            <div>
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 mb-2">
                {product.category}
              </span>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {product.name}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${displayPrice.toFixed(2)}
              </span>
              {product.originalPrice && product.originalPrice > displayPrice && (
                <span className="text-lg text-gray-500 line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            <p className="text-gray-600 dark:text-gray-400">
              {product.description}
            </p>

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded border text-sm font-medium transition-colors ${
                        selectedSize === size
                          ? 'bg-gray-800 text-white border-gray-800 dark:bg-gray-200 dark:text-gray-900 dark:border-gray-200'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded border text-sm font-medium transition-colors ${
                        selectedColor === color
                          ? 'bg-gray-800 text-white border-gray-800 dark:bg-gray-200 dark:text-gray-900 dark:border-gray-200'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Status */}
            {!product.inStock && (
              <p className="text-red-600 dark:text-red-400 font-medium">
                Out of Stock
              </p>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant || !product.inStock}
              className={`w-full py-4 px-6 rounded-lg text-lg font-medium transition-colors ${
                addedToCart
                  ? 'bg-green-600 text-white'
                  : !selectedVariant || !product.inStock
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                  : 'bg-gray-800 text-white hover:bg-gray-900 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-100'
              }`}
            >
              {addedToCart ? '✓ Added to Cart' : 'Add to Cart'}
            </button>

            <Link
              href="/cart"
              className="text-center text-sm text-gray-600 dark:text-gray-400 hover:underline"
            >
              View Cart
            </Link>
          </div>
        </div>
      </div>
    </Boundary>
  );
}