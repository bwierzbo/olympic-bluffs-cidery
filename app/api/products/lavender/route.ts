import { NextResponse } from 'next/server';
import { squareClient } from '@/lib/square';
import productImages from '@/config/product-images.json';

export async function GET() {
  try {

    console.log('=== FETCHING LAVENDER PRODUCTS BY CATEGORY ===');

    // First, get all categories to find the lavender category ID
    const categoryResponse = await squareClient.catalog.list({
      types: 'CATEGORY',
    });

    const categoryMap = new Map<string, string>();
    let lavenderCategoryId: string | undefined;

    if (categoryResponse.data) {
      categoryResponse.data.forEach((cat: any) => {
        if (cat.type === 'CATEGORY' && cat.categoryData?.name) {
          const categoryName = cat.categoryData.name;
          categoryMap.set(cat.id, categoryName);

          // Look for category containing both "online sales" and "lavender"
          const lowerName = categoryName.toLowerCase();
          if (lowerName.includes('online sales') && lowerName.includes('lavender')) {
            lavenderCategoryId = cat.id;
            console.log(`Found lavender category: "${categoryName}" (ID: ${cat.id})`);
          }
        }
      });
    }

    if (!lavenderCategoryId) {
      console.log('⚠️  No "Online Sales | Lavender" category found');
      return NextResponse.json({ success: true, products: [] });
    }

    // Use searchCatalogItems to fetch items by category (supports pagination)
    console.log(`Searching for items in category: ${lavenderCategoryId}`);

    let allItems: any[] = [];
    let cursor: string | undefined = undefined;
    let pageCount = 0;

    do {
      pageCount++;
      const searchResponse = await squareClient.catalog.searchItems({
        categoryIds: [lavenderCategoryId],
        cursor: cursor,
        limit: 100,
      });

      console.log(`Page ${pageCount}: Got ${searchResponse.items?.length || 0} items, cursor: ${searchResponse.cursor ? 'YES' : 'NO'}`);

      if (searchResponse.items) {
        allItems = allItems.concat(searchResponse.items);
      }

      cursor = searchResponse.cursor;

      // Safety limit to prevent infinite loops
      if (pageCount > 20) {
        console.log('⚠️  Hit safety limit of 20 pages');
        break;
      }
    } while (cursor);

    console.log(`=== TOTAL LAVENDER ITEMS FOUND: ${allItems.length} across ${pageCount} pages ===`);

    // Transform items to products
    const products = allItems
      .map((item: any) => {
        // searchCatalogItems returns items with itemData directly
        const itemData = item.itemData;
        if (!itemData) return null;

        // Normalize product name - replace curly apostrophes with regular ones
        const productName = (itemData.name || '').replace(/[\u2018\u2019]/g, "'");

        const variations = itemData.variations || [];
        const firstVariation = variations[0];
        const price = firstVariation?.itemVariationData?.priceMoney?.amount || 0;

        let categoryName = 'Uncategorized';
        if (itemData.categories && itemData.categories.length > 0) {
          const firstCategoryId = itemData.categories[0].id;
          categoryName = categoryMap.get(firstCategoryId) || 'Uncategorized';
        }

        // Get image from local mapping
        const imageMapping = productImages.images as Record<string, string>;
        const imageDirectory = 'shop/lavender';
        const variationImageMapping = (productImages as any).variationImages?.mappings || {};

        let imageUrl = '/images/products/placeholder-lavender.svg';
        const localImageFile = imageMapping[productName];
        if (localImageFile) {
          imageUrl = `/images/${imageDirectory}/${localImageFile}`;
        }

        return {
          id: item.id,
          name: productName,
          type: itemData.productType || 'Product',
          description: itemData.description || '',
          price: Number(price),
          image: imageUrl,
          inStock: variations.some((v: any) =>
            v.itemVariationData?.availableForPickup !== false
          ),
          category: categoryName,
          variations: variations.map((v: any) => {
            const variationName = v.itemVariationData?.name || itemData.name;
            const variationKey = `${productName}|${variationName}`;

            // Get variation image from local mapping
            let variationImageUrl: string | undefined = undefined;
            const variationImageFile = variationImageMapping[variationKey];
            if (variationImageFile) {
              variationImageUrl = `/images/${imageDirectory}/${variationImageFile}`;
            }

            return {
              id: v.id,
              name: variationName,
              price: Number(v.itemVariationData?.priceMoney?.amount || 0),
              sku: v.itemVariationData?.sku,
              image: variationImageUrl,
            };
          }),
        };
      })
      .filter(Boolean);

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error('Error fetching lavender products:', error);
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
