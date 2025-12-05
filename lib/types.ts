// Product Types
export interface ProductVariation {
  id: string;
  name: string;
  price: number; // in cents
  sku?: string;
  image?: string; // Optional variation-specific image
}

export interface Product {
  id: string;
  name: string;
  type: string;
  abv?: string; // Alcohol by volume (e.g., "7%")
  volume?: string; // Volume (e.g., "750ml", "12oz")
  ciderType?: string; // Type of cider (e.g., "Sparkling Semi-Sweet", "Dry Cider")
  taste?: string; // Short taste descriptor (e.g., "Tart & Fruity")
  description: string; // Short description for shop tiles
  longDescription?: string; // Detailed description for product page
  price: number; // in cents (e.g., 1500 = $15.00) - default/base price
  image?: string; // path to product image (default/fallback)
  images?: string[]; // Optional array of additional product images
  inStock: boolean;
  category?: string;
  variations?: ProductVariation[]; // Product variants (e.g., different sizes, scents)
}

// Cart Types
export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariation?: ProductVariation; // Track which variant was selected
}

export interface Cart {
  items: CartItem[];
  totalAmount: number; // in cents
}

// Order Types
export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CustomerInfo {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
}

export type FulfillmentMethod = 'pickup' | 'shipping';

export interface Order {
  id: string;
  items: CartItem[];
  customerInfo: CustomerInfo;
  fulfillmentMethod: FulfillmentMethod;
  shippingAddress?: ShippingAddress;
  subtotal: number; // in cents
  shippingCost: number; // in cents
  tax: number; // in cents
  total: number; // in cents
  createdAt: Date;
  status: 'pending' | 'paid' | 'failed' | 'fulfilled';
}

// Payment Types
export interface PaymentResult {
  success: boolean;
  orderId?: string;
  error?: string;
  payment?: any; // Square payment object
}
