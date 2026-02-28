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
  hoverImage?: string; // Alternate image shown on hover (product in use)
  images?: string[]; // Optional array of additional product images for carousel
  inStock: boolean;
  category?: string;
  variations?: ProductVariation[]; // Product variants (e.g., different sizes, scents)
  weight?: number; // Weight in ounces for shipping calculation
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

export type OrderStatus =
  | 'confirmed'    // Payment successful, order confirmed
  | 'processing'   // Order being prepared
  | 'ready'        // Ready for pickup (pickup orders)
  | 'shipped'      // Shipped (shipping orders)
  | 'on_hold'      // Order paused, requires note
  | 'completed'    // Order fulfilled
  | 'cancelled';   // Order cancelled

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number; // in cents - price per item at time of purchase
  variation?: {
    id: string;
    name: string;
  };
}

export interface Order {
  id: string;
  items: OrderItem[];
  customerInfo: CustomerInfo;
  fulfillmentMethod: FulfillmentMethod;
  shippingAddress?: ShippingAddress;
  subtotal: number; // in cents
  shippingCost: number; // in cents
  tax: number; // in cents
  total: number; // in cents
  paymentId: string; // Square payment ID
  status: OrderStatus;
  createdAt: string; // ISO date string for JSON serialization
  updatedAt: string; // ISO date string
  statusHistory: OrderStatusUpdate[];
}

export interface OrderStatusUpdate {
  status: OrderStatus;
  timestamp: string; // ISO date string
  note?: string;
}

// Payment Types
export interface PaymentResult {
  success: boolean;
  orderId?: string;
  error?: string;
  payment?: any; // Square payment object
}

// Audit Log Types
export interface OrderAuditEntry {
  id: string;
  orderId: string;
  action: 'status_change' | 'tracking_added' | 'note_added' | 'bulk_status_change';
  actor: 'admin' | 'system' | 'customer';
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus | null;
  note: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string; // ISO date string
}

// Pagination Types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Admin Filters
export interface OrderListFilters {
  status?: OrderStatus | OrderStatus[];
  fulfillmentMethod?: FulfillmentMethod;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// Bulk Operations
export interface BulkStatusUpdateRequest {
  orderIds: string[];
  status: OrderStatus;
  note?: string;
}

export interface BulkStatusUpdateResponse {
  succeeded: string[];
  failed: Array<{
    orderId: string;
    error: string;
  }>;
}
