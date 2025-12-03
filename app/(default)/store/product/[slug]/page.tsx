// app/(default)/store/product/[slug]/page.tsx
import React from 'react';
import ProductDetail from './product-detail';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductDetail slug={slug} />;
}