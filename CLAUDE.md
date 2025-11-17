# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Olympic Bluffs Cidery & Lavender Farm website - Next.js e-commerce site with Square Payments integration for selling lavender products (not cider). Features both pickup and shipping fulfillment options.

## Development Commands

```bash
npm run dev      # Start development server at http://localhost:3000
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
```

## Architecture

### Next.js 16 App Router Structure

- **File-based routing**: Pages are `.tsx` files in `/app` directories
- **Server Components by default**: Add `'use client'` directive for client components
- **Root layout** (`app/layout.tsx`): Wraps entire app with `CartProvider` for global cart state

### Square Payments Integration

Two-part architecture:

1. **Client-side** (`app/products/checkout/page.tsx`):
   - Dynamically loads Square Web Payments SDK from CDN: `https://sandbox.web.squarecdn.com/v1/square.js`
   - Tokenizes card details (never sends raw card data to server)
   - Sends token to server API

2. **Server-side** (`app/api/process-payment/route.ts`):
   - Uses Square Node.js SDK (v43.2.0)
   - Processes payment with tokenized source
   - Returns success/failure response

**Important**: BigInt serialization fix applied in `lib/square.ts` to handle Square SDK's BigInt values.

### Shopping Cart State Management

- **CartProvider** (`components/shop/CartProvider.tsx`): React Context provider
- **localStorage persistence**: Cart automatically persists across page refreshes
- **Access via hook**: `const { items, addToCart, removeFromCart, ... } = useCart()`
- **Global state**: Available throughout app via context (no prop drilling)

### Products Data Structure

Products defined in `/data/products.json`:
- 11 lavender products across 7 categories
- Prices stored in cents (e.g., 1500 = $15.00)
- Categories: Body Care, Essential Oils, For the Home, Pantry, Roller Ball, Souvenirs, Tea Towels

## Critical Configuration

### Environment Variables (.env.local)

Required variables:
```bash
# Public (exposed to browser - prefixed with NEXT_PUBLIC_)
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sandbox-sq0idb-...
NEXT_PUBLIC_SQUARE_LOCATION_ID=L82TK15T35V4H

# Private (server-side only)
SQUARE_ACCESS_TOKEN=EAAAl5puE3tcgrvcy3K-uYTpZ3a9jjYEeoyv9S91Kxt4RZxlKXtBwIrT2r-CjnMx

# Environment
SQUARE_ENVIRONMENT=sandbox  # or 'production'

# Optional
NEXT_PUBLIC_SHIPPING_RATE=1000  # Shipping cost in cents ($10.00)
```

**Current setup**: Using Square sandbox credentials. Switch to production credentials when ready to accept real payments.

### Tailwind CSS v4 Configuration

Custom theme defined inline in `app/globals.css`:
- **Custom color palette**: `sage-50` through `sage-900` (brand colors)
- **Font**: Google Fonts Open Sans (weights: 300, 400, 500, 600, 700)
- **Path alias**: `@/*` maps to project root

## Key File Locations

**Type Definitions**: `lib/types.ts`
- Interfaces for Product, CartItem, Cart, Order, CustomerInfo, ShippingAddress

**Square Configuration**: `lib/square.ts`
- Square client initialization
- Environment detection (sandbox vs production)
- Config validation helper

**Payment API**: `app/api/process-payment/route.ts`
- POST endpoint for payment processing
- Handles Square API communication
- Returns orderId on success

**Product Catalog**: `data/products.json`
- Static product data
- Edit this file to add/remove/modify products

## Component Patterns

### Client vs Server Components

**Client components** (require `'use client'`):
- CartProvider, Cart, CartIcon
- ProductCard (has "Add to Cart" interaction)
- Header (has mobile menu state)
- Checkout page (Square SDK integration)

**Server components** (default):
- Page routes without interactivity
- API routes
- Static content pages

### Common Patterns

**Prices**: Always store in cents, format for display with `(cents / 100).toFixed(2)`

**Images**: Use Next.js `Image` component with proper width/height or `fill` prop

**Error States**: Display user-friendly messages in colored alert boxes (see checkout page)

**Loading States**: Disable buttons and show "Processing..." or spinner during async operations

## Shopping Flow

1. Browse `/products` page
2. Click "Add to Cart" on ProductCard → Updates CartProvider state
3. View cart via CartIcon in header (sliding sidebar panel)
4. Click "Proceed to Checkout" → Navigate to `/products/checkout`
5. Fill customer info (name, email, phone)
6. Select fulfillment: "Pickup" (free) or "Shipping" ($10)
7. If shipping: provide address fields (conditional rendering)
8. Verify age (21+) checkbox - required
9. Enter card details in Square payment form
10. Submit → Tokenize card → POST to `/api/process-payment` → Square processes
11. Redirect to `/products/success` or `/products/cancelled`

## Important Notes

### Cart Backdrop Opacity
The cart sidebar backdrop uses inline styles (`style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}`) instead of Tailwind classes for opacity. This was intentionally done to fix an opacity rendering issue.

### Navigation Active States
Header navigation links show gray borders (top/bottom) when the current page matches the link. Logic in `Header.tsx:23-26` handles this with `isActive()` helper.

### Image Overlays
Previous versions had black overlay divs causing images to appear black. These have been removed. If adding overlays for text readability, use `text-shadow` CSS instead of overlay divs.

### Test Card Numbers (Sandbox)
- **Successful payment**: `4111 1111 1111 1111`
- **Declined payment**: `4000 0000 0000 0002`
- CVV: any 3 digits, Expiration: any future date

## Deployment Considerations

Before deploying to production:
1. Update Square credentials to production values in `.env.local`
2. Change `SQUARE_ENVIRONMENT=production`
3. Update Square.js CDN URL in checkout page from `sandbox.web.squarecdn.com` to `web.squarecdn.com`
4. Test thoroughly with real payment methods
5. Ensure `.env.local` is in `.gitignore` (it is by default)
