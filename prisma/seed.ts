import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to generate order IDs
function orderId(index: number): string {
  const ts = 1708900000000 + index * 86400000; // spread across days
  const hex = index.toString(16).padStart(8, '0');
  return `OB-${ts}-${hex}`;
}

// Helper to create a date offset from a base
function dateOffset(baseDays: number, hours = 0): Date {
  const d = new Date('2026-02-01T08:00:00.000Z');
  d.setDate(d.getDate() + baseDays);
  d.setHours(d.getHours() + hours);
  return d;
}

interface SeedOrder {
  id: string;
  items: Array<{ productId: string; name: string; quantity: number; price: number; variation?: { id: string; name: string } }>;
  customerInfo: { email: string; phone: string; firstName: string; lastName: string };
  fulfillmentMethod: 'pickup' | 'shipping';
  shippingAddress?: { fullName: string; addressLine1: string; city: string; state: string; postalCode: string; country: string };
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  paymentId: string;
  status: string;
  trackingNumber?: string;
  adminNotes?: string;
  createdAt: Date;
  statusHistory: Array<{ status: string; timestamp: string; note?: string }>;
  auditLog: Array<{ action: string; actor: string; fromStatus: string | null; toStatus: string | null; note?: string; metadata?: Record<string, unknown>; createdAt: Date }>;
}

const customers = [
  { firstName: 'Jane', lastName: 'Doe', email: 'jane.doe@example.com', phone: '555-0101' },
  { firstName: 'John', lastName: 'Smith', email: 'john.smith@example.com', phone: '555-0102' },
  { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.j@example.com', phone: '555-0103' },
  { firstName: 'Michael', lastName: 'Brown', email: 'mbrown@example.com', phone: '555-0104' },
  { firstName: 'Emily', lastName: 'Davis', email: 'emily.davis@example.com', phone: '555-0105' },
  { firstName: 'Robert', lastName: 'Wilson', email: 'rwilson@example.com', phone: '555-0106' },
  { firstName: 'Lisa', lastName: 'Anderson', email: 'lisa.a@example.com', phone: '555-0107' },
  { firstName: 'David', lastName: 'Taylor', email: 'dtaylor@example.com', phone: '555-0108' },
  { firstName: 'Amanda', lastName: 'Thomas', email: 'amanda.t@example.com', phone: '555-0109' },
  { firstName: 'Chris', lastName: 'Martinez', email: 'chris.m@example.com', phone: '555-0110' },
];

const products = [
  { productId: 'liquid-sunshine-shimmer', name: 'Liquid Sunshine Sun Got a Shimmer - Roller Ball', price: 1200 },
  { productId: 'lavender-sachet', name: 'Lavender Sachet', price: 800 },
  { productId: 'lavender-candle', name: 'Lavender Candle', price: 1800 },
  { productId: 'tea-towel-lavender', name: 'Lavender Tea Towel', price: 1500 },
  { productId: 'lavender-herb-blend', name: 'Lavender Herb Blend', price: 1000 },
];

const shippingAddresses = [
  { fullName: 'Jane Doe', addressLine1: '123 Main St', city: 'Seattle', state: 'WA', postalCode: '98101', country: 'US' },
  { fullName: 'John Smith', addressLine1: '456 Oak Ave', city: 'Portland', state: 'OR', postalCode: '97201', country: 'US' },
  { fullName: 'Sarah Johnson', addressLine1: '789 Pine Rd', city: 'Tacoma', state: 'WA', postalCode: '98401', country: 'US' },
  { fullName: 'Michael Brown', addressLine1: '321 Elm Blvd', city: 'Olympia', state: 'WA', postalCode: '98501', country: 'US' },
  { fullName: 'Emily Davis', addressLine1: '654 Cedar Ln', city: 'Bellingham', state: 'WA', postalCode: '98225', country: 'US' },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickItems(count: number) {
  const selected: typeof products[number][] = [];
  for (let i = 0; i < count; i++) {
    selected.push(pickRandom(products));
  }
  return selected.map(p => ({
    productId: p.productId,
    name: p.name,
    quantity: Math.floor(Math.random() * 3) + 1,
    price: p.price,
  }));
}

function buildOrders(): SeedOrder[] {
  const orders: SeedOrder[] = [];
  let idx = 0;

  // --- CONFIRMED orders (5) ---
  for (let i = 0; i < 5; i++) {
    const customer = customers[idx % customers.length];
    const isPickup = i < 3;
    const items = pickItems(Math.floor(Math.random() * 3) + 1);
    const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const shippingCost = isPickup ? 0 : 2000;
    const total = subtotal + shippingCost;
    const created = dateOffset(idx, idx * 2);

    orders.push({
      id: orderId(idx),
      items,
      customerInfo: customer,
      fulfillmentMethod: isPickup ? 'pickup' : 'shipping',
      shippingAddress: isPickup ? undefined : shippingAddresses[idx % shippingAddresses.length],
      subtotal, shippingCost, tax: 0, total,
      paymentId: `sq_pay_seed_${idx.toString().padStart(3, '0')}`,
      status: 'confirmed',
      trackingNumber: undefined,
      adminNotes: undefined,
      createdAt: created,
      statusHistory: [
        { status: 'confirmed', timestamp: created.toISOString(), note: 'Order confirmed and payment received' },
      ],
      auditLog: [
        { action: 'status_change', actor: 'system', fromStatus: null, toStatus: 'confirmed', note: 'Order confirmed and payment received', createdAt: created },
      ],
    });
    idx++;
  }

  // --- PROCESSING orders (5) ---
  for (let i = 0; i < 5; i++) {
    const customer = customers[idx % customers.length];
    const isPickup = i < 2;
    const items = pickItems(Math.floor(Math.random() * 2) + 1);
    const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const shippingCost = isPickup ? 0 : 2000;
    const total = subtotal + shippingCost;
    const created = dateOffset(idx - 3, 0);
    const processedAt = dateOffset(idx - 3, 4);

    orders.push({
      id: orderId(idx),
      items,
      customerInfo: customer,
      fulfillmentMethod: isPickup ? 'pickup' : 'shipping',
      shippingAddress: isPickup ? undefined : shippingAddresses[idx % shippingAddresses.length],
      subtotal, shippingCost, tax: 0, total,
      paymentId: `sq_pay_seed_${idx.toString().padStart(3, '0')}`,
      status: 'processing',
      createdAt: created,
      statusHistory: [
        { status: 'confirmed', timestamp: created.toISOString(), note: 'Order confirmed and payment received' },
        { status: 'processing', timestamp: processedAt.toISOString(), note: 'Started preparing order' },
      ],
      auditLog: [
        { action: 'status_change', actor: 'system', fromStatus: null, toStatus: 'confirmed', note: 'Order confirmed and payment received', createdAt: created },
        { action: 'status_change', actor: 'admin', fromStatus: 'confirmed', toStatus: 'processing', note: 'Started preparing order', createdAt: processedAt },
      ],
    });
    idx++;
  }

  // --- READY orders (pickup only, 4) ---
  for (let i = 0; i < 4; i++) {
    const customer = customers[idx % customers.length];
    const items = pickItems(Math.floor(Math.random() * 2) + 1);
    const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const total = subtotal;
    const created = dateOffset(idx - 8, 0);
    const processedAt = dateOffset(idx - 8, 3);
    const readyAt = dateOffset(idx - 8, 8);

    orders.push({
      id: orderId(idx),
      items,
      customerInfo: customer,
      fulfillmentMethod: 'pickup',
      subtotal, shippingCost: 0, tax: 0, total,
      paymentId: `sq_pay_seed_${idx.toString().padStart(3, '0')}`,
      status: 'ready',
      createdAt: created,
      statusHistory: [
        { status: 'confirmed', timestamp: created.toISOString(), note: 'Order confirmed and payment received' },
        { status: 'processing', timestamp: processedAt.toISOString() },
        { status: 'ready', timestamp: readyAt.toISOString(), note: 'Ready for pickup at the farm' },
      ],
      auditLog: [
        { action: 'status_change', actor: 'system', fromStatus: null, toStatus: 'confirmed', note: 'Order confirmed and payment received', createdAt: created },
        { action: 'status_change', actor: 'admin', fromStatus: 'confirmed', toStatus: 'processing', createdAt: processedAt },
        { action: 'status_change', actor: 'admin', fromStatus: 'processing', toStatus: 'ready', note: 'Ready for pickup at the farm', createdAt: readyAt },
      ],
    });
    idx++;
  }

  // --- SHIPPED orders (shipping only, 4) ---
  for (let i = 0; i < 4; i++) {
    const customer = customers[idx % customers.length];
    const items = pickItems(Math.floor(Math.random() * 3) + 1);
    const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const shippingCost = 2000;
    const total = subtotal + shippingCost;
    const created = dateOffset(idx - 12, 0);
    const processedAt = dateOffset(idx - 12, 2);
    const shippedAt = dateOffset(idx - 12, 24);
    const tracking = `1Z999AA1${(10000000 + idx).toString()}`;

    orders.push({
      id: orderId(idx),
      items,
      customerInfo: customer,
      fulfillmentMethod: 'shipping',
      shippingAddress: shippingAddresses[idx % shippingAddresses.length],
      subtotal, shippingCost, tax: 0, total,
      paymentId: `sq_pay_seed_${idx.toString().padStart(3, '0')}`,
      status: 'shipped',
      trackingNumber: tracking,
      createdAt: created,
      statusHistory: [
        { status: 'confirmed', timestamp: created.toISOString(), note: 'Order confirmed and payment received' },
        { status: 'processing', timestamp: processedAt.toISOString() },
        { status: 'shipped', timestamp: shippedAt.toISOString(), note: `Tracking: ${tracking}` },
      ],
      auditLog: [
        { action: 'status_change', actor: 'system', fromStatus: null, toStatus: 'confirmed', note: 'Order confirmed and payment received', createdAt: created },
        { action: 'status_change', actor: 'admin', fromStatus: 'confirmed', toStatus: 'processing', createdAt: processedAt },
        { action: 'status_change', actor: 'admin', fromStatus: 'processing', toStatus: 'shipped', note: `Tracking: ${tracking}`, metadata: { trackingNumber: tracking }, createdAt: shippedAt },
        { action: 'tracking_added', actor: 'admin', fromStatus: null, toStatus: null, note: 'Tracking number added', metadata: { trackingNumber: tracking }, createdAt: shippedAt },
      ],
    });
    idx++;
  }

  // --- ON_HOLD orders (3) ---
  const holdReasons = [
    'Customer requested Friday pickup instead',
    'Address correction needed - customer emailed updated address',
    'Out of stock on Lavender Candle - waiting for restock',
  ];
  for (let i = 0; i < 3; i++) {
    const customer = customers[idx % customers.length];
    const isPickup = i === 0;
    const items = pickItems(Math.floor(Math.random() * 2) + 1);
    const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const shippingCost = isPickup ? 0 : 2000;
    const total = subtotal + shippingCost;
    const created = dateOffset(idx - 6, 0);
    const processedAt = dateOffset(idx - 6, 2);
    const holdAt = dateOffset(idx - 6, 6);
    const reason = holdReasons[i];

    orders.push({
      id: orderId(idx),
      items,
      customerInfo: customer,
      fulfillmentMethod: isPickup ? 'pickup' : 'shipping',
      shippingAddress: isPickup ? undefined : shippingAddresses[idx % shippingAddresses.length],
      subtotal, shippingCost, tax: 0, total,
      paymentId: `sq_pay_seed_${idx.toString().padStart(3, '0')}`,
      status: 'on_hold',
      adminNotes: reason,
      createdAt: created,
      statusHistory: [
        { status: 'confirmed', timestamp: created.toISOString(), note: 'Order confirmed and payment received' },
        { status: 'processing', timestamp: processedAt.toISOString() },
        { status: 'on_hold', timestamp: holdAt.toISOString(), note: reason },
      ],
      auditLog: [
        { action: 'status_change', actor: 'system', fromStatus: null, toStatus: 'confirmed', note: 'Order confirmed and payment received', createdAt: created },
        { action: 'status_change', actor: 'admin', fromStatus: 'confirmed', toStatus: 'processing', createdAt: processedAt },
        { action: 'status_change', actor: 'admin', fromStatus: 'processing', toStatus: 'on_hold', note: reason, createdAt: holdAt },
        { action: 'note_added', actor: 'admin', fromStatus: null, toStatus: null, note: reason, createdAt: holdAt },
      ],
    });
    idx++;
  }

  // --- COMPLETED orders (10 - mix of pickup and shipping) ---
  for (let i = 0; i < 10; i++) {
    const customer = customers[idx % customers.length];
    const isPickup = i < 5;
    const items = pickItems(Math.floor(Math.random() * 3) + 1);
    const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const shippingCost = isPickup ? 0 : 2000;
    const total = subtotal + shippingCost;
    const created = dateOffset(idx - 20, 0);
    const processedAt = dateOffset(idx - 20, 3);

    if (isPickup) {
      const readyAt = dateOffset(idx - 20, 8);
      const completedAt = dateOffset(idx - 20, 48);

      orders.push({
        id: orderId(idx),
        items,
        customerInfo: customer,
        fulfillmentMethod: 'pickup',
        subtotal, shippingCost: 0, tax: 0, total: subtotal,
        paymentId: `sq_pay_seed_${idx.toString().padStart(3, '0')}`,
        status: 'completed',
        createdAt: created,
        statusHistory: [
          { status: 'confirmed', timestamp: created.toISOString(), note: 'Order confirmed and payment received' },
          { status: 'processing', timestamp: processedAt.toISOString() },
          { status: 'ready', timestamp: readyAt.toISOString(), note: 'Ready for pickup at the farm' },
          { status: 'completed', timestamp: completedAt.toISOString(), note: 'Customer picked up order' },
        ],
        auditLog: [
          { action: 'status_change', actor: 'system', fromStatus: null, toStatus: 'confirmed', note: 'Order confirmed and payment received', createdAt: created },
          { action: 'status_change', actor: 'admin', fromStatus: 'confirmed', toStatus: 'processing', createdAt: processedAt },
          { action: 'status_change', actor: 'admin', fromStatus: 'processing', toStatus: 'ready', note: 'Ready for pickup at the farm', createdAt: readyAt },
          { action: 'status_change', actor: 'admin', fromStatus: 'ready', toStatus: 'completed', note: 'Customer picked up order', createdAt: completedAt },
        ],
      });
    } else {
      const shippedAt = dateOffset(idx - 20, 24);
      const completedAt = dateOffset(idx - 20, 120);
      const tracking = `1Z999BB2${(20000000 + idx).toString()}`;

      orders.push({
        id: orderId(idx),
        items,
        customerInfo: customer,
        fulfillmentMethod: 'shipping',
        shippingAddress: shippingAddresses[idx % shippingAddresses.length],
        subtotal, shippingCost, tax: 0, total,
        paymentId: `sq_pay_seed_${idx.toString().padStart(3, '0')}`,
        status: 'completed',
        trackingNumber: tracking,
        createdAt: created,
        statusHistory: [
          { status: 'confirmed', timestamp: created.toISOString(), note: 'Order confirmed and payment received' },
          { status: 'processing', timestamp: processedAt.toISOString() },
          { status: 'shipped', timestamp: shippedAt.toISOString(), note: `Tracking: ${tracking}` },
          { status: 'completed', timestamp: completedAt.toISOString(), note: 'Package delivered' },
        ],
        auditLog: [
          { action: 'status_change', actor: 'system', fromStatus: null, toStatus: 'confirmed', note: 'Order confirmed and payment received', createdAt: created },
          { action: 'status_change', actor: 'admin', fromStatus: 'confirmed', toStatus: 'processing', createdAt: processedAt },
          { action: 'status_change', actor: 'admin', fromStatus: 'processing', toStatus: 'shipped', note: `Tracking: ${tracking}`, metadata: { trackingNumber: tracking }, createdAt: shippedAt },
          { action: 'tracking_added', actor: 'admin', fromStatus: null, toStatus: null, metadata: { trackingNumber: tracking }, createdAt: shippedAt },
          { action: 'status_change', actor: 'admin', fromStatus: 'shipped', toStatus: 'completed', note: 'Package delivered', createdAt: completedAt },
        ],
      });
    }
    idx++;
  }

  // --- CANCELLED orders (4) ---
  const cancelReasons = [
    'Customer requested cancellation - found item locally',
    'Unable to fulfill - item discontinued',
    'Duplicate order - customer placed two accidentally',
    'Customer changed mind before processing',
  ];
  for (let i = 0; i < 4; i++) {
    const customer = customers[idx % customers.length];
    const isPickup = i % 2 === 0;
    const items = pickItems(1);
    const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const shippingCost = isPickup ? 0 : 2000;
    const total = subtotal + shippingCost;
    const created = dateOffset(idx - 15, 0);
    const cancelledAt = dateOffset(idx - 15, i < 2 ? 2 : 24);
    const reason = cancelReasons[i];

    const statusHistory: Array<{ status: string; timestamp: string; note?: string }> = [
      { status: 'confirmed', timestamp: created.toISOString(), note: 'Order confirmed and payment received' },
    ];
    const auditLog: SeedOrder['auditLog'] = [
      { action: 'status_change', actor: 'system', fromStatus: null, toStatus: 'confirmed', note: 'Order confirmed and payment received', createdAt: created },
    ];

    // Some cancelled orders went through processing first
    if (i >= 2) {
      const processedAt = dateOffset(idx - 15, 3);
      statusHistory.push({ status: 'processing', timestamp: processedAt.toISOString() });
      auditLog.push({ action: 'status_change', actor: 'admin', fromStatus: 'confirmed', toStatus: 'processing', createdAt: processedAt });
      statusHistory.push({ status: 'cancelled', timestamp: cancelledAt.toISOString(), note: reason });
      auditLog.push({ action: 'status_change', actor: 'admin', fromStatus: 'processing', toStatus: 'cancelled', note: reason, createdAt: cancelledAt });
    } else {
      statusHistory.push({ status: 'cancelled', timestamp: cancelledAt.toISOString(), note: reason });
      auditLog.push({ action: 'status_change', actor: 'admin', fromStatus: 'confirmed', toStatus: 'cancelled', note: reason, createdAt: cancelledAt });
    }

    orders.push({
      id: orderId(idx),
      items,
      customerInfo: customer,
      fulfillmentMethod: isPickup ? 'pickup' : 'shipping',
      shippingAddress: isPickup ? undefined : shippingAddresses[idx % shippingAddresses.length],
      subtotal, shippingCost, tax: 0, total,
      paymentId: `sq_pay_seed_${idx.toString().padStart(3, '0')}`,
      status: 'cancelled',
      adminNotes: reason,
      createdAt: created,
      statusHistory,
      auditLog,
    });
    idx++;
  }

  return orders;
}

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.orderAuditLog.deleteMany();
  await prisma.order.deleteMany();

  const orders = buildOrders();
  console.log(`Creating ${orders.length} orders...`);

  for (const order of orders) {
    await prisma.order.create({
      data: {
        id: order.id,
        items: order.items as any,
        customerInfo: order.customerInfo as any,
        fulfillmentMethod: order.fulfillmentMethod,
        shippingAddress: order.shippingAddress as any,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        tax: order.tax,
        total: order.total,
        paymentId: order.paymentId,
        status: order.status,
        createdAt: order.createdAt,
        statusHistory: order.statusHistory as any,
        trackingNumber: order.trackingNumber,
        adminNotes: order.adminNotes,
        auditLog: {
          create: order.auditLog.map(entry => ({
            action: entry.action,
            actor: entry.actor,
            fromStatus: entry.fromStatus,
            toStatus: entry.toStatus,
            note: entry.note,
            metadata: entry.metadata as any,
            createdAt: entry.createdAt,
          })),
        },
      },
    });
  }

  const totalOrders = await prisma.order.count();
  const totalAuditEntries = await prisma.orderAuditLog.count();
  console.log(`Seeded ${totalOrders} orders with ${totalAuditEntries} audit log entries.`);

  // Print status distribution
  const statuses = await prisma.order.groupBy({
    by: ['status'],
    _count: true,
  });
  console.log('Status distribution:');
  for (const s of statuses) {
    console.log(`  ${s.status}: ${s._count}`);
  }
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
