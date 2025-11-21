import { NextResponse } from 'next/server';
import { squareClient } from '@/lib/square';
import websiteProducts from '@/config/website-products.json';
import productImages from '@/config/product-images.json';

export async function GET() {
  try {
    // Fetch all catalog objects (items and categories)
    // Include custom attribute definitions to ensure we get all custom attributes
    const response = await squareClient.catalog.list({
      types: undefined, // Fetch all types
      includeRelatedObjects: true, // Include related objects like custom attributes
    });

    // The Square SDK returns data in the .data property (array of catalog objects)
    const catalogObjects = response.data || [];

    console.log(`Fetched ${catalogObjects.length} total catalog objects`);

    // Separate items and categories
    const items = catalogObjects.filter((obj: any) => obj.type === 'ITEM');

    // Collect all unique category IDs from items
    const categoryIds = new Set<string>();
    items.forEach((item: any) => {
      if (item.itemData?.categories) {
        item.itemData.categories.forEach((cat: any) => {
          if (cat.id) categoryIds.add(cat.id);
        });
      }
    });

    console.log(`Found ${items.length} items and ${categoryIds.size} unique category IDs`);

    // Debug: Collect ALL custom attribute keys across ALL items
    console.log('=== CUSTOM ATTRIBUTES DEBUG ===');
    const allCustomAttrKeys = new Set<string>();
    const itemsWithCustomAttrs: any[] = [];

    items.forEach((item: any) => {
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
      const firstItem = items[0];
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
          categoryResponse.data.forEach((cat: any) => {
            if (cat.type === 'CATEGORY' && cat.categoryData?.name) {
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
      .map((item: any) => {
        if (!item.itemData) return null;

        const itemData = item.itemData;
        const productName = itemData.name || '';

        // Filter: Only show products that belong to the "online sales" category
        let isInOnlineSalesCategory = false;
        if (itemData.categories && itemData.categories.length > 0) {
          for (const category of itemData.categories) {
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
          categoryName = categoryMap.get(firstCategoryId) || 'Uncategorized';
        }

        // Build product object
        // Use local image mapping for product images
        const imageMapping = productImages.images as Record<string, string>;
        const imageDirectory = (productImages as any).imageDirectory || 'shop';
        const localImageFile = imageMapping[productName];
        const imageUrl = localImageFile
          ? `/images/${imageDirectory}/${localImageFile}`
          : '/images/products/placeholder-lavender.svg';

        return {
          id: item.id,
          name: productName,
          type: itemData.productType || 'Product',
          description: itemData.description || '',
          price: Number(price), // Convert to number (already in cents)
          image: imageUrl,
          inStock: variations.some((v: any) =>
            v.itemVariationData?.availableForPickup !== false
          ),
          category: categoryName,
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
