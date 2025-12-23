import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';

async function migrateOrders() {
  const ordersDir = path.join(process.cwd(), 'data/orders');

  // Check if directory exists
  if (!fs.existsSync(ordersDir)) {
    console.log('No data/orders directory found. Nothing to migrate.');
    return;
  }

  const files = fs.readdirSync(ordersDir).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    console.log('No JSON order files found. Nothing to migrate.');
    return;
  }

  console.log(`Found ${files.length} order file(s) to migrate...\n`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const filePath = path.join(ordersDir, file);

    try {
      const orderData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      // Check if order already exists in DB
      const existing = await prisma.order.findUnique({ where: { id: orderData.id } });
      if (existing) {
        console.log(`[SKIP] Order ${orderData.id} already exists in database`);
        skipped++;
        continue;
      }

      // Insert into database
      await prisma.order.create({
        data: {
          id: orderData.id,
          items: orderData.items,
          customerInfo: orderData.customerInfo,
          fulfillmentMethod: orderData.fulfillmentMethod,
          shippingAddress: orderData.shippingAddress || null,
          subtotal: orderData.subtotal,
          shippingCost: orderData.shippingCost,
          tax: orderData.tax,
          total: orderData.total,
          paymentId: orderData.paymentId,
          status: orderData.status,
          statusHistory: orderData.statusHistory,
          createdAt: new Date(orderData.createdAt),
          updatedAt: new Date(orderData.updatedAt),
        },
      });

      console.log(`[OK] Migrated order: ${orderData.id}`);
      migrated++;
    } catch (error) {
      console.error(`[FAIL] Failed to migrate ${file}:`, error);
      failed++;
    }
  }

  console.log('\n--- Migration Summary ---');
  console.log(`Migrated: ${migrated}`);
  console.log(`Skipped (already exist): ${skipped}`);
  console.log(`Failed: ${failed}`);
}

migrateOrders()
  .then(() => {
    console.log('\nMigration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
