/**
 * One-time migration script: converts existing statusHistory JSON entries
 * on Order rows into OrderAuditLog table rows.
 *
 * Also extracts tracking numbers from status notes matching "Tracking: ..."
 * and writes them to Order.trackingNumber.
 *
 * Usage: npx tsx scripts/backfill-audit-log.ts
 *
 * Safe to run multiple times — skips orders that already have audit log entries.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface StatusHistoryEntry {
  status: string;
  timestamp: string;
  note?: string;
}

async function main() {
  console.log('Starting audit log backfill...');

  const orders = await prisma.order.findMany({
    select: {
      id: true,
      statusHistory: true,
      trackingNumber: true,
      _count: { select: { auditLog: true } },
    },
  });

  console.log(`Found ${orders.length} orders to process.`);

  let backfilledOrders = 0;
  let createdEntries = 0;
  let trackingNumbersExtracted = 0;

  for (const order of orders) {
    // Skip orders that already have audit log entries
    if (order._count.auditLog > 0) {
      console.log(`  Skipping ${order.id} — already has ${order._count.auditLog} audit entries`);
      continue;
    }

    const history = order.statusHistory as unknown as StatusHistoryEntry[];
    if (!Array.isArray(history) || history.length === 0) {
      console.log(`  Skipping ${order.id} — no statusHistory`);
      continue;
    }

    let prevStatus: string | null = null;
    let extractedTracking: string | null = null;

    const auditEntries = history.map((entry) => {
      // Extract tracking number from notes like "Tracking: 1Z999AA10123456784"
      const trackingMatch = entry.note?.match(/^Tracking:\s*(.+)$/i);
      if (trackingMatch) {
        extractedTracking = trackingMatch[1].trim();
      }

      const auditEntry = {
        orderId: order.id,
        action: 'status_change' as const,
        actor: 'system' as const,
        fromStatus: prevStatus,
        toStatus: entry.status,
        note: entry.note || null,
        metadata: trackingMatch ? { trackingNumber: extractedTracking } : undefined,
        createdAt: new Date(entry.timestamp),
      };

      prevStatus = entry.status;
      return auditEntry;
    });

    // Create audit log entries
    await prisma.orderAuditLog.createMany({
      data: auditEntries.map((e) => ({
        orderId: e.orderId,
        action: e.action,
        actor: e.actor,
        fromStatus: e.fromStatus,
        toStatus: e.toStatus,
        note: e.note,
        metadata: e.metadata as any,
        createdAt: e.createdAt,
      })),
    });
    createdEntries += auditEntries.length;

    // Update tracking number if found and not already set
    if (extractedTracking && !order.trackingNumber) {
      await prisma.order.update({
        where: { id: order.id },
        data: { trackingNumber: extractedTracking },
      });
      trackingNumbersExtracted++;
      console.log(`  Extracted tracking number for ${order.id}: ${extractedTracking}`);
    }

    backfilledOrders++;
    console.log(`  Backfilled ${order.id} — ${auditEntries.length} entries`);
  }

  console.log('\n--- Backfill Summary ---');
  console.log(`Orders processed: ${backfilledOrders}`);
  console.log(`Audit entries created: ${createdEntries}`);
  console.log(`Tracking numbers extracted: ${trackingNumbersExtracted}`);
  console.log(`Orders skipped (already had entries): ${orders.length - backfilledOrders}`);
}

main()
  .catch((e) => {
    console.error('Backfill error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
