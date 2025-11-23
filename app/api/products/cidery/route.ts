import { NextResponse } from 'next/server';
import { squareClient } from '@/lib/square';
import productImages from '@/config/product-images.json';

export async function GET() {
  try {

    console.log('=== FETCHING CIDER PRODUCTS BY CATEGORY ===');

    // First, get all categories to find the cider category ID
    const categoryResponse = await squareClient.catalog.list({
      types: 'CATEGORY',
    });

    const categoryMap = new Map<string, string>();
    let ciderCategoryId: string | undefined;

    if (categoryResponse.data) {
      categoryResponse.data.forEach((cat: any) => {
        if (cat.type === 'CATEGORY' && cat.categoryData?.name) {
          const categoryName = cat.categoryData.name;
          categoryMap.set(cat.id, categoryName);

          // Look for category containing both "online sales" and "cider"
          const lowerName = categoryName.toLowerCase();
          if (lowerName.includes('online sales') && lowerName.includes('cider')) {
            ciderCategoryId = cat.id;
            console.log(`Found cider category: "${categoryName}" (ID: ${cat.id})`);
          }
        }
      });
    }

    if (!ciderCategoryId) {
      console.log('⚠️  No "Online Sales | Cider" category found');
      return NextResponse.json({ success: true, products: [] });
    }

    // Use searchCatalogItems to fetch items by category (supports pagination)
    console.log(`Searching for items in category: ${ciderCategoryId}`);

    let allItems: any[] = [];
    let cursor: string | undefined = undefined;
    let pageCount = 0;

    do {
      pageCount++;
      const searchResponse = await squareClient.catalog.searchItems({
        categoryIds: [ciderCategoryId],
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

    console.log(`=== TOTAL CIDER ITEMS FOUND: ${allItems.length} across ${pageCount} pages ===`);

    // Transform items to products
    const products = allItems
      .map((item: any) => {
        // searchCatalogItems returns items with itemData directly
        const itemData = item.itemData;
        if (!itemData) return null;

        // Normalize product name - replace curly apostrophes with regular ones
        const productName = (itemData.name || '').replace(/[\u2018\u2019]/g, "'");

        console.log(`Processing cider product: "${productName}"`);

        const variations = itemData.variations || [];
        const firstVariation = variations[0];
        const price = firstVariation?.itemVariationData?.priceMoney?.amount || 0;

        let categoryName = 'Cider';
        if (itemData.categories && itemData.categories.length > 0) {
          const firstCategoryId = itemData.categories[0].id;
          categoryName = categoryMap.get(firstCategoryId) || 'Cider';
        }

        // Get image from local mapping
        const imageMapping = productImages.images as Record<string, string>;
        const imageDirectory = 'shop/cider';
        const variationImageMapping = (productImages as any).variationImages?.mappings || {};

        let imageUrl = '/images/products/placeholder-cider.svg';
        const localImageFile = imageMapping[productName];
        if (localImageFile) {
          imageUrl = `/images/${imageDirectory}/${localImageFile}`;
        }

        // Extract ABV, volume, and clean description
        let abv = undefined;
        let volume = undefined;
        let ciderType = itemData.productType || undefined;
        let cleanDescription = itemData.description || '';

        // Try to extract from description
        // Supports structured format: Description: ... \n Volume: 375ml \n ABV: 6.5%
        if (itemData.description) {
          // Try structured format first
          const descriptionMatch = itemData.description.match(/Description:\s*([\s\S]+?)(?=\n|Volume:|ABV:|$)/i);
          const structuredAbvMatch = itemData.description.match(/ABV:\s*(\d+\.?\d*)%?/i);
          const structuredVolumeMatch = itemData.description.match(/Volume:\s*(\d+)\s*(ml|oz)/i);

          // Try inline format as fallback (e.g., "6.5% ABV" or "375ml")
          const inlineAbvMatch = itemData.description.match(/(\d+\.?\d*)%\s*ABV/i);
          const inlineVolumeMatch = itemData.description.match(/(\d+)\s*(ml|oz)/i);

          // Extract clean description if structured format is used
          if (descriptionMatch) {
            cleanDescription = descriptionMatch[1].trim();
          }

          if (structuredAbvMatch) {
            abv = structuredAbvMatch[1] + '%';
          } else if (inlineAbvMatch) {
            abv = inlineAbvMatch[1] + '%';
          }

          if (structuredVolumeMatch) {
            volume = structuredVolumeMatch[1] + structuredVolumeMatch[2];
          } else if (inlineVolumeMatch) {
            volume = inlineVolumeMatch[1] + inlineVolumeMatch[2];
          }
        }

        // Check variation names for volume info as final fallback
        if (!volume && firstVariation?.itemVariationData?.name) {
          const varName = firstVariation.itemVariationData.name;
          const volumeMatch = varName.match(/(\d+\s*ml|\d+\s*oz)/i);
          if (volumeMatch) volume = volumeMatch[1];
        }

        return {
          id: item.id,
          name: productName,
          type: itemData.productType || 'Cider',
          abv,
          volume,
          ciderType,
          description: cleanDescription,
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

    console.log(`=== RETURNING ${products.length} CIDER PRODUCTS ===`);

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error('Error fetching cider products:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch cider products',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
