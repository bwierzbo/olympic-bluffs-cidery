// Product Types
export interface Product {
  id: string;
  name: string;
  type: 'Year-Round' | 'Seasonal' | 'Limited Release';
  abv: string;
  description: string;
  price: number; // in cents (e.g., 1500 = $15.00)
  image?: string; // path to product image
  inStock: boolean;
  category?: string;
}

// Cart Types
export interface CartItem {
  product: Product;
  quantity: number;
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
