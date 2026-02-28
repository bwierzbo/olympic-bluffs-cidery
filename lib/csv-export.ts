import type { OrderSummary } from '@/lib/orders';

const CSV_COLUMNS = [
  'Order ID',
  'Status',
  'Customer Name',
  'Email',
  'Fulfillment',
  'Items',
  'Total',
  'Tracking',
  'Created Date',
];

/** Escape a CSV field value. Wraps in quotes if it contains commas, quotes, or newlines. */
function escapeField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Format cents as dollar string (e.g., 1500 -> "$15.00") */
function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Format an array of OrderSummary objects as a CSV string.
 */
export function formatOrdersAsCsv(orders: OrderSummary[]): string {
  const header = CSV_COLUMNS.join(',');

  const rows = orders.map((order) => {
    const fields = [
      order.id,
      order.status,
      order.customerName,
      order.customerEmail,
      order.fulfillmentMethod,
      String(order.itemCount),
      formatCents(order.total),
      order.trackingNumber || '',
      new Date(order.createdAt).toISOString(),
    ];
    return fields.map(escapeField).join(',');
  });

  return [header, ...rows].join('\n');
}
