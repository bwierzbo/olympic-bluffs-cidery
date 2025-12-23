import { prisma } from './prisma';
import { Order, OrderStatus, OrderItem, CustomerInfo, ShippingAddress, FulfillmentMethod } from './types';

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

  const statusHistory = [
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
      items: dbOrder.items as OrderItem[],
      customerInfo: dbOrder.customerInfo as CustomerInfo,
      fulfillmentMethod: dbOrder.fulfillmentMethod as FulfillmentMethod,
      shippingAddress: dbOrder.shippingAddress as ShippingAddress | undefined,
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
    items: dbOrder.items as OrderItem[],
    customerInfo: dbOrder.customerInfo as CustomerInfo,
    fulfillmentMethod: dbOrder.fulfillmentMethod as FulfillmentMethod,
    shippingAddress: dbOrder.shippingAddress as ShippingAddress | undefined,
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
      items: dbOrder.items as OrderItem[],
      customerInfo: dbOrder.customerInfo as CustomerInfo,
      fulfillmentMethod: dbOrder.fulfillmentMethod as FulfillmentMethod,
      shippingAddress: dbOrder.shippingAddress as ShippingAddress | undefined,
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
      items: dbOrder.items as OrderItem[],
      customerInfo: dbOrder.customerInfo as CustomerInfo,
      fulfillmentMethod: dbOrder.fulfillmentMethod as FulfillmentMethod,
      shippingAddress: dbOrder.shippingAddress as ShippingAddress | undefined,
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
