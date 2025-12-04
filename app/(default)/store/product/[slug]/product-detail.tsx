// app/(default)/store/product/[slug]/product-detail.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Boundary } from '@/components/ui/boundary';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { amazonProducts, AmazonProduct } from '@/lib/amazon-products';

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

interface PrintfulProduct {
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

type Product = (PrintfulProduct & { isAmazon: false }) | (AmazonProduct & { isAmazon: true });

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
          <div className="h-14 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
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
    // First check if it's an Amazon product
    const amazonProduct = amazonProducts.find((p) => p.slug === slug);
    if (amazonProduct) {
      setProduct({ ...amazonProduct, isAmazon: true });
      setLoading(false);
      return;
    }

    // Otherwise fetch from Printful
    fetch('/api/printful/products')
      .then(res => res.json())
      .then(data => {
        const foundProduct = data.products?.find((p: any) => p.slug === slug);
        if (foundProduct) {
          setProduct({ ...foundProduct, isAmazon: false });
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
    if (product && !product.isAmazon && (selectedSize || selectedColor)) {
      const printfulProduct = product as PrintfulProduct & { isAmazon: false };
      const variant = printfulProduct.variants?.find(v => {
        const sizeMatch = !selectedSize || v.size === selectedSize;
        const colorMatch = !selectedColor || v.color === selectedColor;
        return sizeMatch && colorMatch;
      });
      
      if (variant) {
        setSelectedVariant(variant);
      } else if (printfulProduct.variants?.length > 0) {
        setSelectedVariant(printfulProduct.variants[0]);
      }
    }
  }, [product, selectedSize, selectedColor]);

  const handleAddToCart = () => {
    if (!product || product.isAmazon || !selectedVariant) return;

    const printfulProduct = product as PrintfulProduct & { isAmazon: false };

    addItem({
      id: `${printfulProduct.id}-${selectedSize}-${selectedColor}`,
      productId: printfulProduct.id,
      name: printfulProduct.name,
      size: selectedSize,
      color: selectedColor,
      price: selectedVariant.price,
      quantity: 1,
      image: printfulProduct.image,
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

  // Amazon Product Detail
  if (product.isAmazon) {
    const amazonProduct = product as AmazonProduct & { isAmazon: true };
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
            {/* Product Image */}
            <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center p-4">
              <img
                src={amazonProduct.image}
                alt={amazonProduct.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Product Info */}
            <div className="flex flex-col gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                    {amazonProduct.category}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200">
                    Partner Product
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {amazonProduct.name}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${amazonProduct.price.toFixed(2)}
                </span>
              </div>

              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {amazonProduct.description}
              </p>

              {/* Amazon Notice */}
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  This is a partner product sold through Amazon. Clicking the button below will take you to Amazon to complete your purchase.
                </p>
              </div>

              {/* Buy on Amazon Button */}
              <a
                href={amazonProduct.amazonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 rounded-lg text-lg font-medium transition-colors bg-[#FF9900] hover:bg-[#e88b00] text-white flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.502.126.112.172.04.332-.217.478-.32.182-.65.344-.993.489-.222.104-.466.2-.733.287-.456.153-.906.287-1.35.4-.894.233-1.81.39-2.75.47-.94.08-1.88.12-2.82.12-.97 0-1.94-.036-2.91-.107-.97-.07-1.92-.19-2.86-.36-.94-.17-1.86-.396-2.76-.68-.9-.28-1.76-.61-2.59-.98-.22-.1-.43-.2-.64-.31-.21-.11-.39-.22-.55-.33C.138 18.348.012 18.196.045 18.02zm11.87 2.82c-3.94 0-7.6-.93-10.97-2.78-.1-.06-.13-.14-.07-.24.06-.1.15-.11.25-.05 3.37 1.77 6.97 2.66 10.79 2.66 3.92 0 7.6-.94 11.04-2.81.1-.06.19-.04.25.05.06.1.04.19-.06.25-3.47 1.93-7.19 2.93-11.23 2.93z"/>
                </svg>
                Buy on Amazon
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              {/* Affiliate Disclosure */}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                As an Amazon Associate, we earn from qualifying purchases. Price and availability subject to change.
              </p>

              <Link
                href="/store"
                className="text-center text-sm text-gray-600 dark:text-gray-400 hover:underline"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </Boundary>
    );
  }

  // Printful Product Detail
  const printfulProduct = product as PrintfulProduct & { isAmazon: false };
  const displayPrice = selectedVariant?.price || printfulProduct.price;

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
          {/* Product Image */}
          <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            <img
              src={printfulProduct.image || '/api/placeholder/300/300'}
              alt={printfulProduct.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Info */}
          <div className="flex flex-col gap-6">
            <div>
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 mb-2">
                {printfulProduct.category}
              </span>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {printfulProduct.name}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${displayPrice.toFixed(2)}
              </span>
              {printfulProduct.originalPrice && printfulProduct.originalPrice > displayPrice && (
                <span className="text-lg text-gray-500 line-through">
                  ${printfulProduct.originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            <p className="text-gray-600 dark:text-gray-400">
              {printfulProduct.description}
            </p>

            {/* Size Selector */}
            {printfulProduct.sizes && printfulProduct.sizes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {printfulProduct.sizes.map(size => (
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
            {printfulProduct.colors && printfulProduct.colors.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {printfulProduct.colors.map(color => (
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
            {!printfulProduct.inStock && (
              <p className="text-red-600 dark:text-red-400 font-medium">
                Out of Stock
              </p>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant || !printfulProduct.inStock}
              className={`w-full py-4 px-6 rounded-lg text-lg font-medium transition-colors ${
                addedToCart
                  ? 'bg-green-600 text-white'
                  : !selectedVariant || !printfulProduct.inStock
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