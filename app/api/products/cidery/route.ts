import { NextResponse } from 'next/server';
import { squareClient } from '@/lib/square';
import productImages from '@/config/product-images.json';

export async function GET() {
  try {
    console.log('=== FETCHING CIDER PRODUCTS BY CATEGORY ===');
    console.log('Environment check:', {
      hasSquareToken: !!process.env.SQUARE_ACCESS_TOKEN,
      hasAppId: !!process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
      hasLocationId: !!process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
      environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
    });

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
        const rawProductName = (itemData.name || '').replace(/[\u2018\u2019]/g, "'");

        // Clean up display name - remove "Cider Bottle" suffix for cleaner display
        const productName = rawProductName
          .replace(/\s+Cider Bottle$/i, '')
          .replace(/\s+Bottle$/i, '');

        console.log(`Processing cider product: "${productName}"`);

        const variations = itemData.variations || [];
        const firstVariation = variations[0];
        const price = firstVariation?.itemVariationData?.priceMoney?.amount || 0;

        let categoryName = 'Cider';
        if (itemData.categories && itemData.categories.length > 0) {
          const firstCategoryId = itemData.categories[0].id;
          categoryName = categoryMap.get(firstCategoryId) || 'Cider';
        }

        // Get image from local mapping (cider uses ciderImages, not lavenderFolders)
        const imageMapping = (productImages as any).ciderImages as Record<string, string>;
        const imageDirectory = 'shop/cider';

        let imageUrl = '/images/products/placeholder-cider.svg';
        // Use rawProductName for image lookup since config has full Square names
        const localImageFile = imageMapping[rawProductName];
        if (localImageFile) {
          imageUrl = `/images/${imageDirectory}/${localImageFile}`;
        }

        // Extract structured fields from Square description
        // Supports: Name, Description, LongDescription, Taste, Volume, ABV
        let customName: string | undefined = undefined;
        let shortDescription = '';
        let longDescription = '';
        let taste: string | undefined = undefined;
        let abv: string | undefined = undefined;
        let volume: string | undefined = undefined;
        let ciderType = itemData.productType || undefined;

        if (itemData.description) {
          const desc = itemData.description;

          // Parse structured fields (supports both "Description" and "ShortDescription")
          const nameMatch = desc.match(/Name:\s*(.+?)(?=\n|Short[Dd]escription:|Description:|Long[Dd]escription:|Taste:|Volume:|ABV:|$)/i);
          const shortDescMatch = desc.match(/(?:Short[Dd]escription|Description):\s*([\s\S]+?)(?=\n\n|Long[Dd]escription:|Taste:|Volume:|ABV:|$)/i);
          const longDescMatch = desc.match(/Long[Dd]escription:\s*([\s\S]+?)(?=\n\n|Taste:|Volume:|ABV:|$)/i);
          const tasteMatch = desc.match(/Taste:\s*(.+?)(?=\n|Volume:|ABV:|$)/i);
          const volumeMatch = desc.match(/Volume:\s*(\d+)\s*(ml|oz)/i);
          const abvMatch = desc.match(/ABV:\s*(\d+\.?\d*)%?/i);

          // Fallback inline formats
          const inlineAbvMatch = desc.match(/(\d+\.?\d*)%\s*ABV/i);
          const inlineVolumeMatch = desc.match(/(\d+)\s*(ml|oz)/i);

          if (nameMatch) customName = nameMatch[1].trim();
          if (shortDescMatch) shortDescription = shortDescMatch[1].trim();
          if (longDescMatch) longDescription = longDescMatch[1].trim();
          if (tasteMatch) taste = tasteMatch[1].trim();

          if (volumeMatch) {
            volume = volumeMatch[1] + volumeMatch[2];
          } else if (inlineVolumeMatch) {
            volume = inlineVolumeMatch[1] + inlineVolumeMatch[2];
          }

          if (abvMatch) {
            abv = abvMatch[1] + '%';
          } else if (inlineAbvMatch) {
            abv = inlineAbvMatch[1] + '%';
          }

          // If no structured description, use full text as short description
          if (!shortDescription && !longDescription) {
            shortDescription = desc;
          }
        }

        // Check variation names for volume info as final fallback
        if (!volume && firstVariation?.itemVariationData?.name) {
          const varName = firstVariation.itemVariationData.name;
          const volumeMatch = varName.match(/(\d+\s*ml|\d+\s*oz)/i);
          if (volumeMatch) volume = volumeMatch[1];
        }

        // Use custom name if provided, otherwise use cleaned product name
        const displayName = customName || productName;

        return {
          id: item.id,
          name: displayName,
          type: itemData.productType || 'Cider',
          abv,
          volume,
          ciderType,
          taste,
          description: shortDescription,
          longDescription,
          price: Number(price),
          image: imageUrl,
          inStock: variations.some((v: any) =>
            v.itemVariationData?.availableForPickup !== false
          ),
          category: categoryName,
          variations: variations.map((v: any) => {
            const variationName = v.itemVariationData?.name || itemData.name;

            return {
              id: v.id,
              name: variationName,
              price: Number(v.itemVariationData?.priceMoney?.amount || 0),
              sku: v.itemVariationData?.sku,
            };
          }),
        };
      })
      .filter(Boolean);

    console.log(`=== RETURNING ${products.length} CIDER PRODUCTS ===`);

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error('Error fetching cider products:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch cider products',
        details: error.message,
        errorName: error.name,
        errorCode: error.code,
      },
      { status: 500 }
    );
  }
}
