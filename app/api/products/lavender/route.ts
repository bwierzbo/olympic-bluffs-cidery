import { NextResponse } from 'next/server';
import { getSquareClient, getSquarePublicConfig } from '@/lib/square';

export const dynamic = 'force-dynamic';

// Narrow types for Square catalog responses (SDK types are complex discriminated unions;
// we only access a subset of fields on camelCase properties).
// Uses null|undefined to match Square SDK's emitted type signatures.
type Nullable<T> = T | null | undefined;

interface SquareVariation {
  id?: Nullable<string>;
  itemVariationData?: Nullable<{
    name?: Nullable<string>;
    sku?: Nullable<string>;
    priceMoney?: Nullable<{ amount?: Nullable<number | bigint | string> }>;
    availableForPickup?: Nullable<boolean>;
  }>;
}

interface SquareCatalogItem {
  id?: Nullable<string>;
  type?: Nullable<string>;
  itemData?: Nullable<{
    name?: Nullable<string>;
    description?: Nullable<string>;
    productType?: Nullable<string>;
    categories?: Nullable<Array<{ id?: Nullable<string> }>>;
    variations?: Nullable<SquareVariation[]>;
    imageIds?: Nullable<string[]>;
  }>;
  categoryData?: Nullable<{
    name?: Nullable<string>;
  }>;
}

interface CatalogObjectFetchResponse {
  object?: {
    image_data?: { url?: string };
  };
}

// In-memory cache for image URLs (survives across requests, clears on server restart)
const imageCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

export async function GET() {
  try {
    const client = getSquareClient();
    const config = getSquarePublicConfig();
    const token =
      config.environment === 'sandbox'
        ? process.env.SQUARE_SANDBOX_ACCESS_TOKEN || ''
        : process.env.SQUARE_PROD_ACCESS_TOKEN || '';

    const apiBase =
      config.environment === 'sandbox'
        ? 'https://connect.squareupsandbox.com'
        : 'https://connect.squareup.com';

    /** Fetch image URL with caching */
    async function fetchImageUrl(imageId: string): Promise<string | null> {
      // Check cache
      const cached = imageCache.get(imageId);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.url;
      }

      try {
        const res = await fetch(`${apiBase}/v2/catalog/object/${imageId}`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (!res.ok) return null;
        const data: CatalogObjectFetchResponse = await res.json();
        const url = data.object?.image_data?.url || null;
        if (url) {
          imageCache.set(imageId, { url, timestamp: Date.now() });
        }
        return url;
      } catch {
        return null;
      }
    }

    /** Batch fetch image URLs with concurrency limit */
    async function fetchAllImageUrls(imageIds: string[]): Promise<Map<string, string>> {
      const results = new Map<string, string>();
      const uncachedIds: string[] = [];

      // Resolve from cache first
      for (const id of imageIds) {
        const cached = imageCache.get(id);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          results.set(id, cached.url);
        } else {
          uncachedIds.push(id);
        }
      }

      // Fetch uncached in batches of 10
      for (let i = 0; i < uncachedIds.length; i += 10) {
        const batch = uncachedIds.slice(i, i + 10);
        const urls = await Promise.all(batch.map(id => fetchImageUrl(id)));
        batch.forEach((id, idx) => {
          if (urls[idx]) results.set(id, urls[idx]!);
        });
      }

      return results;
    }

    // Get all categories
    const categoryResponse = await client.catalog.list({ types: 'CATEGORY' });

    const categoryMap = new Map<string, string>();
    let lavenderCategoryId: string | undefined;

    if (categoryResponse.data) {
      (categoryResponse.data as unknown as SquareCatalogItem[]).forEach((cat) => {
        if (cat.type === 'CATEGORY' && cat.categoryData?.name && cat.id) {
          const categoryName = cat.categoryData.name;
          categoryMap.set(cat.id, categoryName);

          const lowerName = categoryName.toLowerCase();
          if (lowerName.includes('online sales') && lowerName.includes('lavender')) {
            lavenderCategoryId = cat.id;
          }
        }
      });
    }

    if (!lavenderCategoryId) {
      return NextResponse.json({ success: true, products: [] });
    }

    // Fetch all items in the category
    let allItems: SquareCatalogItem[] = [];
    let cursor: string | undefined = undefined;
    let pageCount = 0;

    do {
      pageCount++;
      const searchResponse = await client.catalog.searchItems({
        categoryIds: [lavenderCategoryId],
        cursor,
        limit: 100,
      });

      if (searchResponse.items) {
        allItems = allItems.concat(searchResponse.items as SquareCatalogItem[]);
      }
      cursor = searchResponse.cursor;
      if (pageCount > 20) break;
    } while (cursor);

    // Collect all image IDs upfront
    const allImageIds: string[] = [];
    for (const item of allItems) {
      const ids = item.itemData?.imageIds || [];
      allImageIds.push(...ids);
    }

    // Batch fetch all images at once
    const imageUrlMap = await fetchAllImageUrls(allImageIds);

    // Transform items using pre-fetched image URLs
    const products = allItems
      .map((item: SquareCatalogItem) => {
        const itemData = item.itemData;
        if (!itemData) return null;

        const productName = (itemData.name || '').replace(/[\u2018\u2019]/g, "'");
        const variations = itemData.variations || [];
        const firstVariation = variations[0];
        const price = firstVariation?.itemVariationData?.priceMoney?.amount || 0;

        let categoryName = 'Uncategorized';
        if (itemData.categories && itemData.categories.length > 0) {
          const firstCategoryId = itemData.categories[0].id;
          if (firstCategoryId) {
            categoryName = categoryMap.get(firstCategoryId) || 'Uncategorized';
          }
        }

        // Resolve images from pre-fetched map
        const imageIds: string[] = itemData.imageIds || [];
        const validImages = imageIds
          .map((id: string) => imageUrlMap.get(id))
          .filter((url): url is string => !!url);

        const mainImage = validImages[0] || '/images/products/placeholder-lavender.svg';
        const hoverImage = validImages[1] || undefined;
        const carouselImages = validImages.length > 1 ? validImages : undefined;

        return {
          id: item.id,
          name: productName,
          type: itemData.productType || 'Product',
          description: itemData.description || '',
          price: Number(price),
          image: mainImage,
          hoverImage,
          images: carouselImages,
          inStock: variations.some(
            (v: SquareVariation) => v.itemVariationData?.availableForPickup !== false
          ),
          category: categoryName,
          variations: variations.map((v: SquareVariation) => ({
            id: v.id,
            name: v.itemVariationData?.name || itemData.name,
            price: Number(v.itemVariationData?.priceMoney?.amount || 0),
            sku: v.itemVariationData?.sku,
          })),
        };
      })
      .filter(Boolean);

    return NextResponse.json({ success: true, products });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error fetching lavender products:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products',
        details: err.message,
      },
      { status: 500 }
    );
  }
}
