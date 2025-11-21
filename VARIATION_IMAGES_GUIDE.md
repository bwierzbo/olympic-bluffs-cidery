# Product Variation Images Guide

This guide explains how to configure different images for product variations in your e-commerce store.

## Overview

Your store now supports:
- **Product-level images**: Default image for each product
- **Variation-level images**: Specific images for each product variation (e.g., different sizes, colors, scents)
- **Multiple product images**: Array of images for product galleries (future feature)

When a customer selects a variation on the product detail page, the image will automatically update to show the variation-specific image (if configured).

## Configuration

### 1. Update `config/product-images.json`

Add a `variationImages` section to your configuration file:

```json
{
  "imageDirectory": "shop",

  "images": {
    "Lavender Essential Oil": "lavender-oil-default.png",
    "Bath Salts": "bath-salts-default.png"
  },

  "variationImages": {
    "mappings": {
      "Lavender Essential Oil|Small (10ml)": "lavender-oil-small.png",
      "Lavender Essential Oil|Large (30ml)": "lavender-oil-large.png",
      "Bath Salts|Lavender": "bath-salts-lavender.png",
      "Bath Salts|Rose": "bath-salts-rose.png",
      "Bath Salts|Eucalyptus": "bath-salts-eucalyptus.png"
    }
  }
}
```

### 2. Naming Convention

The key format for variation images is:
```
"Product Name|Variation Name": "image-filename.png"
```

**Important:**
- Product Name must match exactly what's in Square
- Variation Name must match exactly what's in Square
- Use the pipe character `|` as separator
- Image files go in `/public/images/shop/` (or your configured imageDirectory)

### 3. Example: Bath Product with Multiple Scents

If you have a product "Lavender Bath Bomb" with variations:
- Regular (default)
- Rose Scent
- Eucalyptus Scent

Configure it like this:

```json
{
  "images": {
    "Lavender Bath Bomb": "bath-bomb-lavender.png"
  },

  "variationImages": {
    "mappings": {
      "Lavender Bath Bomb|Regular": "bath-bomb-lavender.png",
      "Lavender Bath Bomb|Rose Scent": "bath-bomb-rose.png",
      "Lavender Bath Bomb|Eucalyptus Scent": "bath-bomb-eucalyptus.png"
    }
  }
}
```

### 4. Example: Cider with Multiple Bottle Sizes

If you have a cider product with different sizes:

```json
{
  "images": {
    "Kingston Black Cider": "kingston-black-750ml.png"
  },

  "variationImages": {
    "mappings": {
      "Kingston Black Cider|750ml Bottle": "kingston-black-750ml.png",
      "Kingston Black Cider|375ml Bottle": "kingston-black-375ml.png",
      "Kingston Black Cider|6-Pack": "kingston-black-6pack.png"
    }
  }
}
```

## How It Works

1. **Default Behavior**: Product displays the main product image
2. **User Selects Variation**: When customer clicks a variation option
3. **Image Updates**: If a variation-specific image exists, it replaces the main image
4. **Smooth Transition**: Image fades smoothly (300ms CSS transition)
5. **Fallback**: If no variation image exists, the main product image is shown

## Image Requirements

- **Format**: PNG, JPG, or SVG
- **Recommended Size**: 1000x1000px (square aspect ratio)
- **Max File Size**: Keep under 500KB for fast loading
- **Location**: Place all images in `/public/images/shop/`

## Testing Your Configuration

1. Add your variation images to `/public/images/shop/`
2. Update `config/product-images.json` with the mappings
3. Restart your development server (if needed)
4. Visit a product page with variations
5. Click different variations to see images change

## Troubleshooting

### Image Not Showing
- Check that the image file exists in `/public/images/shop/`
- Verify the filename in config matches exactly (case-sensitive)
- Check browser console for 404 errors

### Wrong Image Displayed
- Verify Product Name and Variation Name match Square exactly
- Check for typos in the mapping key
- Ensure you're using the pipe `|` separator

### Image Not Changing When Selecting Variation
- Clear browser cache and refresh
- Check that the variation has an image configured
- Verify the variation name in Square matches your config

## API Response Structure

When fetching products, variations now include an optional `image` field:

```typescript
{
  "id": "PRODUCT_ID",
  "name": "Lavender Essential Oil",
  "image": "/images/shop/lavender-oil-default.png",
  "variations": [
    {
      "id": "VAR_1",
      "name": "Small (10ml)",
      "price": 1500,
      "image": "/images/shop/lavender-oil-small.png"  // Variation-specific
    },
    {
      "id": "VAR_2",
      "name": "Large (30ml)",
      "price": 2500,
      "image": "/images/shop/lavender-oil-large.png"  // Variation-specific
    }
  ]
}
```

## Future Enhancements

Potential features to add:
- Multiple images per product (image gallery)
- Image zoom on hover
- 360° product views
- Customer-uploaded images for reviews
- Video support for product demonstrations
