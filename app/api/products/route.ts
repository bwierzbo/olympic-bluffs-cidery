import { NextResponse } from 'next/server';
import { squareClient } from '@/lib/square';
import productImages from '@/config/product-images.json';

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
    labelColor?: Nullable<string>;
    customAttributeValues?: Nullable<Record<string, unknown>>;
  }>;
  categoryData?: Nullable<{
    name?: Nullable<string>;
  }>;
  customAttributeValues?: Nullable<Record<string, unknown>>;
  labelColor?: Nullable<string>;
  tags?: unknown;
}

interface ProductImagesConfig {
  lavenderFolders?: Record<string, string>;
  ciderImages?: Record<string, string>;
}

export async function GET() {
  try {
    // Fetch all catalog objects (items and categories)
    // Include custom attribute definitions to ensure we get all custom attributes
    const response = await squareClient.catalog.list({
      types: undefined, // Fetch all types
    });

    // The Square SDK returns data in the .data property (array of catalog objects)
    const catalogObjects = response.data || [];

    console.log(`Fetched ${catalogObjects.length} total catalog objects`);

    // Separate items and categories
    const items = (catalogObjects as unknown as SquareCatalogItem[]).filter(
      (obj) => obj.type === 'ITEM',
    );

    // Collect all unique category IDs from items
    const categoryIds = new Set<string>();
    items.forEach((item: SquareCatalogItem) => {
      if (item.itemData?.categories) {
        item.itemData.categories.forEach((cat) => {
          if (cat.id) categoryIds.add(cat.id);
        });
      }
    });

    console.log(`Found ${items.length} items and ${categoryIds.size} unique category IDs`);

    // Debug: Collect ALL custom attribute keys across ALL items
    console.log('=== CUSTOM ATTRIBUTES DEBUG ===');
    const allCustomAttrKeys = new Set<string>();
    const itemsWithCustomAttrs: Array<{ name?: string | null; keys: string[]; values: Record<string, unknown> }> = [];

    items.forEach((item: SquareCatalogItem) => {
      const customAttrs = item.customAttributeValues || item.itemData?.customAttributeValues;
      if (customAttrs && Object.keys(customAttrs).length > 0) {
        itemsWithCustomAttrs.push({
          name: item.itemData?.name,
          keys: Object.keys(customAttrs),
          values: customAttrs,
        });
        Object.keys(customAttrs).forEach(key => allCustomAttrKeys.add(key));
      }
    });

    console.log(`Found ${itemsWithCustomAttrs.length} items with custom attributes`);
    console.log(`Total unique custom attribute keys: ${allCustomAttrKeys.size}`);
    console.log('All custom attribute keys found:');
    allCustomAttrKeys.forEach(key => console.log(`  - ${key}`));

    if (itemsWithCustomAttrs.length > 0) {
      console.log('\nFirst 3 items with custom attributes:');
      itemsWithCustomAttrs.slice(0, 3).forEach((item, idx) => {
        console.log(`\n${idx + 1}. ${item.name}:`);
        console.log('   Keys:', item.keys);
        console.log('   Values:', item.values);
      });
    }

    // Check first item for all available fields that might contain filters
    if (items.length > 0) {
      console.log('\n=== FIRST ITEM FULL STRUCTURE ===');
      const firstItem: SquareCatalogItem = items[0];
      console.log('Top-level keys:', Object.keys(firstItem));
      console.log('itemData keys:', Object.keys(firstItem.itemData || {}));
      console.log('Has labelColor?', firstItem.labelColor);
      console.log('Has tags?', firstItem.tags);
      console.log('itemData.labelColor?', firstItem.itemData?.labelColor);
    }

    // Fetch category details by IDs if we have any
    const categoryMap = new Map<string, string>();
    if (categoryIds.size > 0) {
      try {
        // Fetch categories using the list API with category filter
        const categoryResponse = await squareClient.catalog.list({
          types: 'CATEGORY',
        });

        if (categoryResponse.data) {
          (categoryResponse.data as unknown as SquareCatalogItem[]).forEach((cat) => {
            if (cat.type === 'CATEGORY' && cat.categoryData?.name && cat.id) {
              categoryMap.set(cat.id, cat.categoryData.name);
            }
          });
        }
        console.log(`Fetched ${categoryMap.size} category names`);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }

    // Transform Square catalog items to our Product format
    const products = items
      .map((item: SquareCatalogItem) => {
        if (!item.itemData) return null;

        const itemData = item.itemData;
        const productName = itemData.name || '';

        // Filter: Only show products that belong to the "online sales" category
        let isInOnlineSalesCategory = false;
        if (itemData.categories && itemData.categories.length > 0) {
          for (const category of itemData.categories) {
            if (!category.id) continue;
            const categoryName = categoryMap.get(category.id);
            if (categoryName && categoryName.toLowerCase() === 'online sales') {
              isInOnlineSalesCategory = true;
              break;
            }
          }
        }

        // Skip products that are not in the "online sales" category
        if (!isInOnlineSalesCategory) {
          return null;
        }

        const variations = itemData.variations || [];

        // Get the first variation for price info
        const firstVariation = variations[0];
        const price = firstVariation?.itemVariationData?.priceMoney?.amount || 0;

        // Get category name from the first category in the categories array
        let categoryName = 'Uncategorized';
        if (itemData.categories && itemData.categories.length > 0) {
          const firstCategoryId = itemData.categories[0].id;
          if (firstCategoryId) {
            categoryName = categoryMap.get(firstCategoryId) || 'Uncategorized';
          }
        }

        // Build product object
        // Use local image mapping for product images
        const lavenderFolders = (productImages as ProductImagesConfig).lavenderFolders || {};
        const ciderImages = (productImages as ProductImagesConfig).ciderImages || {};

        // Check lavender folders first, then cider images
        let imageUrl = '/images/products/placeholder-lavender.svg';
        if (lavenderFolders[productName]) {
          imageUrl = `/images/shop/lavender/${lavenderFolders[productName]}/main.png`;
        } else if (ciderImages[productName]) {
          imageUrl = `/images/shop/cider/${ciderImages[productName]}`;
        }

        return {
          id: item.id,
          name: productName,
          type: itemData.productType || 'Product',
          description: itemData.description || '',
          price: Number(price), // Convert to number (already in cents)
          image: imageUrl,
          inStock: variations.some((v: SquareVariation) =>
            v.itemVariationData?.availableForPickup !== false
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
      .filter(Boolean); // Remove nulls

    return NextResponse.json({ success: true, products });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error fetching Square catalog:', error);
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
