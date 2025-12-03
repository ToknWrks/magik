// app/api/printful/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const res = await fetch(`https://api.printful.com/store/products/${id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`,
      },
    });
    const data = await res.json();

    const syncProduct = data.result.sync_product;
    const syncVariants = data.result.sync_variants;
    const firstVariant = syncVariants?.[0];

    const sizes = Array.from(new Set(syncVariants.map((v: any) => v.size).filter(Boolean)));
    const colors = Array.from(new Set(syncVariants.map((v: any) => v.color).filter(Boolean)));

    const product = {
      id: syncProduct.id,
      name: syncProduct.name,
      slug: syncProduct.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      description: syncProduct.name,
      category: firstVariant?.product?.type_name || 'Product',
      image: syncProduct.thumbnail_url,
      price: parseFloat(firstVariant?.retail_price) || 0,
      originalPrice: parseFloat(firstVariant?.retail_price) || null,
      inStock: firstVariant?.is_ignored === false,
      featured: false,
      sizes,
      colors,
      variants: syncVariants.map((v: any) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        size: v.size,
        color: v.color,
        price: parseFloat(v.retail_price) || 0,
        currency: v.currency,
        image: v.files?.[0]?.preview_url || syncProduct.thumbnail_url,
      })),
    };

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Printful API error:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}