import { prisma } from './prisma';
import { Prisma } from '@prisma/client';
import { Order, OrderStatus, OrderItem, CustomerInfo, ShippingAddress, FulfillmentMethod, OrderAuditEntry } from './types';

/**
 * Create a new order
 */
export async function createOrder(orderData: {
  id: string;
  items: OrderItem[];
  customerInfo: CustomerInfo;
  fulfillmentMethod: FulfillmentMethod;
  shippingAddress?: ShippingAddress;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  paymentId: string;
}): Promise<Order> {
  const now = new Date().toISOString();

  const statusHistory: Order['statusHistory'] = [
    {
      status: 'confirmed',
      timestamp: now,
      note: 'Order confirmed and payment received'
    }
  ];

  const dbOrder = await prisma.order.create({
    data: {
      id: orderData.id,
      items: orderData.items as any,
      customerInfo: orderData.customerInfo as any,
      fulfillmentMethod: orderData.fulfillmentMethod,
      shippingAddress: orderData.shippingAddress as any,
      subtotal: orderData.subtotal,
      shippingCost: orderData.shippingCost,
      tax: orderData.tax,
      total: orderData.total,
      paymentId: orderData.paymentId,
      status: 'confirmed',
      statusHistory: statusHistory as any,
    },
  });

  return {
    ...orderData,
    status: 'confirmed' as OrderStatus,
    createdAt: dbOrder.createdAt.toISOString(),
    updatedAt: dbOrder.updatedAt.toISOString(),
    statusHistory,
  };
}

/**
 * Get an order by ID
 */
export async function getOrder(orderId: string): Promise<Order | null> {
  try {
    const dbOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!dbOrder) return null;

    return {
      id: dbOrder.id,
      items: dbOrder.items as unknown as OrderItem[],
      customerInfo: dbOrder.customerInfo as unknown as CustomerInfo,
      fulfillmentMethod: dbOrder.fulfillmentMethod as FulfillmentMethod,
      shippingAddress: dbOrder.shippingAddress as unknown as ShippingAddress | undefined,
      subtotal: dbOrder.subtotal,
      shippingCost: dbOrder.shippingCost,
      tax: dbOrder.tax,
      total: dbOrder.total,
      paymentId: dbOrder.paymentId,
      status: dbOrder.status as OrderStatus,
      createdAt: dbOrder.createdAt.toISOString(),
      updatedAt: dbOrder.updatedAt.toISOString(),
      statusHistory: dbOrder.statusHistory as any,
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  note?: string
): Promise<Order | null> {
  const order = await getOrder(orderId);

  if (!order) {
    return null;
  }

  const now = new Date().toISOString();

  const newStatusHistory = [
    ...order.statusHistory,
    {
      status: newStatus,
      timestamp: now,
      note
    }
  ];

  const dbOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: newStatus,
      statusHistory: newStatusHistory as any,
    },
  });

  return {
    id: dbOrder.id,
    items: dbOrder.items as unknown as OrderItem[],
    customerInfo: dbOrder.customerInfo as unknown as CustomerInfo,
    fulfillmentMethod: dbOrder.fulfillmentMethod as FulfillmentMethod,
    shippingAddress: dbOrder.shippingAddress as unknown as ShippingAddress | undefined,
    subtotal: dbOrder.subtotal,
    shippingCost: dbOrder.shippingCost,
    tax: dbOrder.tax,
    total: dbOrder.total,
    paymentId: dbOrder.paymentId,
    status: dbOrder.status as OrderStatus,
    createdAt: dbOrder.createdAt.toISOString(),
    updatedAt: dbOrder.updatedAt.toISOString(),
    statusHistory: dbOrder.statusHistory as any,
  };
}

/**
 * Get all orders (for admin use)
 */
export async function getAllOrders(): Promise<Order[]> {
  try {
    const dbOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return dbOrders.map(dbOrder => ({
      id: dbOrder.id,
      items: dbOrder.items as unknown as OrderItem[],
      customerInfo: dbOrder.customerInfo as unknown as CustomerInfo,
      fulfillmentMethod: dbOrder.fulfillmentMethod as FulfillmentMethod,
      shippingAddress: dbOrder.shippingAddress as unknown as ShippingAddress | undefined,
      subtotal: dbOrder.subtotal,
      shippingCost: dbOrder.shippingCost,
      tax: dbOrder.tax,
      total: dbOrder.total,
      paymentId: dbOrder.paymentId,
      status: dbOrder.status as OrderStatus,
      createdAt: dbOrder.createdAt.toISOString(),
      updatedAt: dbOrder.updatedAt.toISOString(),
      statusHistory: dbOrder.statusHistory as any,
    }));
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

/**
 * Get orders by customer email (for customer lookup)
 */
export async function getOrdersByEmail(email: string): Promise<Order[]> {
  try {
    const dbOrders = await prisma.order.findMany({
      where: {
        customerInfo: {
          path: ['email'],
          equals: email,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return dbOrders.map(dbOrder => ({
      id: dbOrder.id,
      items: dbOrder.items as unknown as OrderItem[],
      customerInfo: dbOrder.customerInfo as unknown as CustomerInfo,
      fulfillmentMethod: dbOrder.fulfillmentMethod as FulfillmentMethod,
      shippingAddress: dbOrder.shippingAddress as unknown as ShippingAddress | undefined,
      subtotal: dbOrder.subtotal,
      shippingCost: dbOrder.shippingCost,
      tax: dbOrder.tax,
      total: dbOrder.total,
      paymentId: dbOrder.paymentId,
      status: dbOrder.status as OrderStatus,
      createdAt: dbOrder.createdAt.toISOString(),
      updatedAt: dbOrder.updatedAt.toISOString(),
      statusHistory: dbOrder.statusHistory as any,
    }));
  } catch (error) {
    console.error('Error fetching orders by email:', error);
    return [];
  }
}

/**
 * Delete an order (admin only - use cautiously)
 */
export async function deleteOrder(orderId: string): Promise<boolean> {
  try {
    await prisma.order.delete({
      where: { id: orderId },
    });
    return true;
  } catch (error) {
    console.error('Error deleting order:', error);
    return false;
  }
}

// --- Admin paginated queries (PR2) ---

const VALID_STATUSES: OrderStatus[] = [
  'confirmed', 'processing', 'ready', 'shipped', 'on_hold', 'completed', 'cancelled',
];

const ACTIVE_STATUSES: OrderStatus[] = ['confirmed', 'processing', 'ready', 'shipped', 'on_hold'];
const ARCHIVED_STATUSES: OrderStatus[] = ['completed', 'cancelled'];

export interface GetOrdersPaginatedParams {
  page: number;
  pageSize: number;
  status?: string;       // comma-separated or "active" / "archived"
  fulfillment?: string;  // "pickup" | "shipping"
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: string;
  tab?: string;          // "active" | "completed" -- shorthand
}

export interface OrderSummary {
  id: string;
  status: OrderStatus;
  fulfillmentMethod: FulfillmentMethod;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  total: number;
  trackingNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedOrdersResult {
  data: OrderSummary[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  counts: Record<string, number>;
}

/**
 * Get orders with server-side pagination, filtering, sorting, and search.
 */
export async function getOrdersPaginated(params: GetOrdersPaginatedParams): Promise<PaginatedOrdersResult> {
  const {
    page,
    pageSize,
    status,
    fulfillment,
    search,
    dateFrom,
    dateTo,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    tab,
  } = params;

  // Build WHERE clause
  const where: Prisma.OrderWhereInput = {};

  // Tab shorthand overrides status filter
  if (tab === 'active') {
    where.status = { in: ACTIVE_STATUSES };
  } else if (tab === 'completed') {
    where.status = { in: ARCHIVED_STATUSES };
  } else if (status) {
    if (status === 'active') {
      where.status = { in: ACTIVE_STATUSES };
    } else if (status === 'archived') {
      where.status = { in: ARCHIVED_STATUSES };
    } else {
      const statuses = status.split(',').filter(s => VALID_STATUSES.includes(s as OrderStatus));
      if (statuses.length > 0) {
        where.status = { in: statuses };
      }
    }
  }

  if (fulfillment === 'pickup' || fulfillment === 'shipping') {
    where.fulfillmentMethod = fulfillment;
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) {
      where.createdAt.gte = new Date(dateFrom);
    }
    if (dateTo) {
      // Include the entire end date by setting to end of day
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = endDate;
    }
  }

  if (search && search.trim()) {
    const s = search.trim();
    where.OR = [
      { id: { contains: s, mode: 'insensitive' } },
      { customerInfo: { path: ['email'], string_contains: s } },
      { customerInfo: { path: ['firstName'], string_contains: s } },
      { customerInfo: { path: ['lastName'], string_contains: s } },
      { customerInfo: { path: ['phone'], string_contains: s } },
    ];
  }

  // Build ORDER BY
  const validSortFields = ['createdAt', 'updatedAt', 'total', 'status'];
  const field = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const direction = sortOrder === 'asc' ? 'asc' : 'desc';
  const orderBy: Prisma.OrderOrderByWithRelationInput = { [field]: direction };

  const skip = (page - 1) * pageSize;

  // Run paginated query and count in parallel
  const [dbOrders, totalItems, countsByStatus] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
  ]);

  // Build counts map
  const counts: Record<string, number> = {};
  for (const row of countsByStatus) {
    counts[row.status] = row._count.id;
  }

  // Transform to summary view
  const data: OrderSummary[] = dbOrders.map(dbOrder => {
    const customerInfo = dbOrder.customerInfo as unknown as CustomerInfo;
    const items = dbOrder.items as unknown as OrderItem[];
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      id: dbOrder.id,
      status: dbOrder.status as OrderStatus,
      fulfillmentMethod: dbOrder.fulfillmentMethod as FulfillmentMethod,
      customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
      customerEmail: customerInfo.email,
      itemCount,
      total: dbOrder.total,
      trackingNumber: dbOrder.trackingNumber,
      createdAt: dbOrder.createdAt.toISOString(),
      updatedAt: dbOrder.updatedAt.toISOString(),
    };
  });

  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  return {
    data,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    counts,
  };
}

/**
 * Get a single order with its full audit log.
 */
export async function getOrderWithAuditLog(orderId: string): Promise<{
  order: Order & { trackingNumber: string | null; adminNotes: string | null };
  auditLog: OrderAuditEntry[];
} | null> {
  const dbOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      auditLog: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!dbOrder) return null;

  const order = {
    id: dbOrder.id,
    items: dbOrder.items as unknown as OrderItem[],
    customerInfo: dbOrder.customerInfo as unknown as CustomerInfo,
    fulfillmentMethod: dbOrder.fulfillmentMethod as FulfillmentMethod,
    shippingAddress: dbOrder.shippingAddress as unknown as ShippingAddress | undefined,
    subtotal: dbOrder.subtotal,
    shippingCost: dbOrder.shippingCost,
    tax: dbOrder.tax,
    total: dbOrder.total,
    paymentId: dbOrder.paymentId,
    status: dbOrder.status as OrderStatus,
    createdAt: dbOrder.createdAt.toISOString(),
    updatedAt: dbOrder.updatedAt.toISOString(),
    statusHistory: dbOrder.statusHistory as any,
    trackingNumber: dbOrder.trackingNumber,
    adminNotes: dbOrder.adminNotes,
  };

  const auditLog: OrderAuditEntry[] = dbOrder.auditLog.map(entry => ({
    id: entry.id,
    orderId: entry.orderId,
    action: entry.action as OrderAuditEntry['action'],
    actor: entry.actor as OrderAuditEntry['actor'],
    fromStatus: entry.fromStatus as OrderStatus | null,
    toStatus: entry.toStatus as OrderStatus | null,
    note: entry.note,
    metadata: entry.metadata as Record<string, unknown> | null,
    createdAt: entry.createdAt.toISOString(),
  }));

  return { order, auditLog };
}

/**
 * Get paginated audit log entries for an order.
 */
export async function getOrderAuditLogPaginated(
  orderId: string,
  page: number,
  pageSize: number,
  action?: string,
): Promise<{
  data: OrderAuditEntry[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
} | null> {
  // Verify the order exists
  const orderExists = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true },
  });
  if (!orderExists) return null;

  const where: Prisma.OrderAuditLogWhereInput = { orderId };
  if (action) {
    where.action = action;
  }

  const skip = (page - 1) * pageSize;

  const [entries, totalItems] = await Promise.all([
    prisma.orderAuditLog.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip,
      take: pageSize,
    }),
    prisma.orderAuditLog.count({ where }),
  ]);

  const data: OrderAuditEntry[] = entries.map(entry => ({
    id: entry.id,
    orderId: entry.orderId,
    action: entry.action as OrderAuditEntry['action'],
    actor: entry.actor as OrderAuditEntry['actor'],
    fromStatus: entry.fromStatus as OrderStatus | null,
    toStatus: entry.toStatus as OrderStatus | null,
    note: entry.note,
    metadata: entry.metadata as Record<string, unknown> | null,
    createdAt: entry.createdAt.toISOString(),
  }));

  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  return {
    data,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
