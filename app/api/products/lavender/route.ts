import { NextResponse } from 'next/server';
import { squareClient } from '@/lib/square';
import productImages from '@/config/product-images.json';
import fs from 'fs';
import path from 'path';

// Helper to scan a product folder for images
function scanProductFolder(folderName: string): {
  mainImage: string;
  hoverImage?: string;
  images: string[];
} {
  const basePath = path.join(process.cwd(), 'public/images/shop/lavender', folderName);
  const urlBase = `/images/shop/lavender/${folderName}`;

  let mainImage = '/images/products/placeholder-lavender.svg';
  let hoverImage: string | undefined = undefined;
  const images: string[] = [];

  // Check if folder exists
  if (!fs.existsSync(basePath)) {
    return { mainImage, hoverImage, images };
  }

  // Check for main.png (also try .jpg, .webp)
  for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
    if (fs.existsSync(path.join(basePath, `main.${ext}`))) {
      mainImage = `${urlBase}/main.${ext}`;
      break;
    }
  }

  // Check for hover.png
  for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
    if (fs.existsSync(path.join(basePath, `hover.${ext}`))) {
      hoverImage = `${urlBase}/hover.${ext}`;
      break;
    }
  }

  // Scan for numbered images (1.png, 2.png, etc.)
  for (let i = 1; i <= 20; i++) {
    let found = false;
    for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
      if (fs.existsSync(path.join(basePath, `${i}.${ext}`))) {
        images.push(`${urlBase}/${i}.${ext}`);
        found = true;
        break;
      }
    }
    if (!found) break; // Stop when sequence ends
  }

  return { mainImage, hoverImage, images };
}

export async function GET() {
  try {
    console.log('=== FETCHING LAVENDER PRODUCTS BY CATEGORY ===');
    console.log('Environment check:', {
      hasSquareToken: !!process.env.SQUARE_ACCESS_TOKEN,
      hasAppId: !!process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
      hasLocationId: !!process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
      environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
    });

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

    // Get folder mappings from config
    const folderMapping = (productImages as any).lavenderFolders as Record<string, string>;
    const variationFolderMapping = (productImages as any).variationFolders as Record<string, string>;

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

        // Get folder name for this product
        const folderName = folderMapping[productName];

        // Scan folder for images
        let mainImage = '/images/products/placeholder-lavender.svg';
        let hoverImage: string | undefined = undefined;
        let carouselImages: string[] = [];

        if (folderName) {
          const scanned = scanProductFolder(folderName);
          mainImage = scanned.mainImage;
          hoverImage = scanned.hoverImage;
          carouselImages = scanned.images;
        }

        return {
          id: item.id,
          name: productName,
          type: itemData.productType || 'Product',
          description: itemData.description || '',
          price: Number(price),
          image: mainImage,
          hoverImage,
          images: carouselImages.length > 0 ? carouselImages : undefined,
          inStock: variations.some((v: any) =>
            v.itemVariationData?.availableForPickup !== false
          ),
          category: categoryName,
          variations: variations.map((v: any) => {
            const variationName = v.itemVariationData?.name || itemData.name;
            const variationKey = `${productName}|${variationName}`;

            // Get variation folder from mapping
            let variationImageUrl: string | undefined = undefined;
            const variationFolder = variationFolderMapping[variationKey];
            if (variationFolder) {
              const scanned = scanProductFolder(variationFolder);
              variationImageUrl = scanned.mainImage !== '/images/products/placeholder-lavender.svg'
                ? scanned.mainImage
                : undefined;
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
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products',
        details: error.message,
        errorName: error.name,
        errorCode: error.code,
      },
      { status: 500 }
    );
  }
}
