// app/(default)/store/product/[slug]/page.tsx
import React from 'react';
import ProductDetail from './product-detail';
import { Metadata } from 'next';
import { amazonProducts } from '@/lib/amazon-products';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  // Check if it's an Amazon product first
  const amazonProduct = amazonProducts.find(p => p.slug === slug);
  
  if (amazonProduct) {
    const title = `${amazonProduct.name} - ${amazonProduct.category} | Real Illuminati Store`;
    const description = amazonProduct.description || `Shop ${amazonProduct.name} from our curated collection. High-quality ${amazonProduct.category} products with fast shipping.`;
    
    const keywords = [
      amazonProduct.category.toLowerCase(),
      amazonProduct.name.toLowerCase().split(' ').slice(0, 3).join(' '),
      'illuminati merchandise',
      'esoteric products',
      'spiritual items',
      'occult store'
    ];

    return {
      title,
      description,
      keywords,
      authors: [{ name: 'Real Illuminati' }],
      creator: 'Real Illuminati',
      publisher: 'Real Illuminati',
      formatDetection: {
        email: false,
        address: false,
        telephone: false,
      },
      metadataBase: new URL('https://illuminati.co'),
      alternates: {
        canonical: `/store/product/${slug}`,
      },
      openGraph: {
        title,
        description,
        url: `/store/product/${slug}`,
        siteName: 'Real Illuminati Store',
        locale: 'en_US',
        type: 'website',
        images: [
          {
            url: amazonProduct.image,
            width: 800,
            height: 800,
            alt: amazonProduct.name,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [amazonProduct.image],
        creator: '@realilluminati',
        site: '@realilluminati',
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      verification: {
        google: 'your-google-verification-code',
      },
    };
  }

  // For Printful products, we'll need to fetch the product data
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/printful/products`, {
      cache: 'force-cache', // Use cache for build time
    });
    
    if (response.ok) {
      const data = await response.json();
      const product = data.products?.find((p: any) => p.slug === slug);
      
      if (product) {
        const title = `${product.name} - ${product.category} | Real Illuminati Store`;
        const description = product.description || `Shop ${product.name} from our curated collection. High-quality ${product.category} products with fast shipping.`;
        
        const keywords = [
          product.category.toLowerCase(),
          product.name.toLowerCase().split(' ').slice(0, 3).join(' '),
          'illuminati merchandise',
          'esoteric products',
          'spiritual items',
          'occult store',
          'printful products'
        ];

        return {
          title,
          description,
          keywords,
          authors: [{ name: 'Real Illuminati' }],
          creator: 'Real Illuminati',
          publisher: 'Real Illuminati',
          formatDetection: {
            email: false,
            address: false,
            telephone: false,
          },
          metadataBase: new URL('https://illuminati.co'),
          alternates: {
            canonical: `/store/product/${slug}`,
          },
          openGraph: {
            title,
            description,
            url: `/store/product/${slug}`,
            siteName: 'Real Illuminati Store',
            locale: 'en_US',
            type: 'website',
            images: [
              {
                url: product.image || '/images/product-placeholder.jpg',
                width: 800,
                height: 800,
                alt: product.name,
              },
            ],
          },
          twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [product.image || '/images/product-placeholder.jpg'],
            creator: '@realilluminati',
            site: '@realilluminati',
          },
          robots: {
            index: true,
            follow: true,
            googleBot: {
              index: true,
              follow: true,
              'max-video-preview': -1,
              'max-image-preview': 'large',
              'max-snippet': -1,
            },
          },
          verification: {
            google: 'your-google-verification-code',
          },
        };
      }
    }
  } catch (error) {
    console.error('Error fetching product for metadata:', error);
  }

  // Fallback metadata
  return {
    title: 'Product Not Found | Real Illuminati Store',
    description: 'The requested product could not be found. Browse our collection of esoteric and spiritual merchandise.',
    keywords: ['illuminati merchandise', 'esoteric products', 'spiritual items', 'occult store'],
    metadataBase: new URL('https://illuminati.co'),
    alternates: {
      canonical: `/store/product/${slug}`,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  return <ProductDetail slug={slug} />;
}