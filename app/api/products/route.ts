import { NextResponse } from 'next/server';
import { squareClient } from '@/lib/square';
import websiteProducts from '@/config/website-products.json';

export async function GET() {
  try {
    // Get list of allowed product names (skip first item which is instructions)
    const allowedProducts = websiteProducts.slice(1).filter(
      (item): item is string => typeof item === 'string'
    );

    // Fetch catalog items from Square
    const response = await squareClient.catalog.list({
      types: 'ITEM',
    });

    const catalogObjects = response.result.objects || [];

    // Transform Square catalog items to our Product format
    const products = catalogObjects
      .map((item: any) => {
        if (!item.itemData) return null;

        const itemData = item.itemData;
        const productName = itemData.name || '';

        // Filter: Only include products in our allowed list
        if (!allowedProducts.includes(productName)) {
          return null;
        }

        const variations = itemData.variations || [];

        // Get the first variation for price info
        const firstVariation = variations[0];
        const price = firstVariation?.itemVariationData?.priceMoney?.amount || 0;

        // Build product object
        return {
          id: item.id,
          name: productName,
          type: itemData.productType || 'Product',
          description: itemData.description || '',
          price: Number(price), // Convert to number (already in cents)
          image: itemData.imageIds?.[0]
            ? `/api/catalog-image/${itemData.imageIds[0]}`
            : '/images/products/placeholder-lavender.svg',
          inStock: variations.some((v: any) =>
            v.itemVariationData?.availableForPickup !== false
          ),
          category: itemData.categoryId || 'Uncategorized',
          variations: variations.map((v: any) => ({
            id: v.id,
            name: v.itemVariationData?.name || itemData.name,
            price: Number(v.itemVariationData?.priceMoney?.amount || 0),
            sku: v.itemVariationData?.sku,
          })),
        };
      })
      .filter(Boolean); // Remove nulls

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error('Error fetching Square catalog:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
