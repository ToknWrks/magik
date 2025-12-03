// app/api/printful/products/by-slug/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    console.log('Looking for slug:', slug);
    
    // Fetch all products
    const res = await fetch('https://api.printful.com/store/products', {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`,
      },
    });
    const data = await res.json();

    // Find product by matching slug
    const matchingProduct = data.result.find((product: any) => {
      const productSlug = product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      console.log('Comparing:', productSlug, 'with:', slug);
      return productSlug === slug;
    });

    if (!matchingProduct) {
      console.log('Product not found for slug:', slug);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    console.log('Found product:', matchingProduct.id, matchingProduct.name);

    // Fetch product details
    const detailRes = await fetch(`https://api.printful.com/store/products/${matchingProduct.id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`,
      },
    });
    const detailData = await detailRes.json();

    const syncProduct = detailData.result.sync_product;
    const syncVariants = detailData.result.sync_variants;
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
      inStock: true,
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