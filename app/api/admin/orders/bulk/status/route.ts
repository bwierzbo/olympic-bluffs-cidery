import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getOrder, updateOrderStatus } from '@/lib/orders';
import { validateTransition } from '@/lib/status-transitions';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@/lib/types';

const MAX_BULK_SIZE = 50;

/**
 * POST /api/admin/orders/bulk/status
 * Bulk status update. Processes each order independently (partial success).
 *
 * Body: { orderIds: string[], status: OrderStatus, note?: string }
 * Response: { succeeded: string[], failed: { orderId: string, error: string }[] }
 */
export async function POST(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  let body: { orderIds?: string[]; status?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'INVALID_JSON', detail: 'Request body must be valid JSON' },
      { status: 400 },
    );
  }

  const { orderIds, status: newStatus, note } = body;

  if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
    return NextResponse.json(
      { error: 'MISSING_FIELD', detail: "'orderIds' must be a non-empty array" },
      { status: 400 },
    );
  }

  if (!newStatus) {
    return NextResponse.json(
      { error: 'MISSING_FIELD', detail: "'status' is required" },
      { status: 400 },
    );
  }

  if (orderIds.length > MAX_BULK_SIZE) {
    return NextResponse.json(
      { error: 'LIMIT_EXCEEDED', detail: `Maximum ${MAX_BULK_SIZE} orders per bulk operation` },
      { status: 400 },
    );
  }

  const succeeded: string[] = [];
  const failed: Array<{ orderId: string; error: string }> = [];

  for (const orderId of orderIds) {
    try {
      const order = await getOrder(orderId);
      if (!order) {
        failed.push({ orderId, error: `Order '${orderId}' not found` });
        continue;
      }

      const validation = validateTransition(
        { status: order.status, fulfillmentMethod: order.fulfillmentMethod },
        newStatus as OrderStatus,
        note,
      );

      if (!validation.valid) {
        failed.push({ orderId, error: validation.detail || 'Invalid transition' });
        continue;
      }

      const fromStatus = order.status;

      const updated = await updateOrderStatus(orderId, newStatus as OrderStatus, note);
      if (!updated) {
        failed.push({ orderId, error: 'Failed to update order' });
        continue;
      }

      await prisma.orderAuditLog.create({
        data: {
          orderId,
          action: 'bulk_status_change',
          actor: 'admin',
          fromStatus,
          toStatus: newStatus,
          note: note || null,
        },
      });

      succeeded.push(orderId);
    } catch (err) {
      failed.push({
        orderId,
        error: err instanceof Error ? err.message : 'Unexpected error',
      });
    }
  }

  return NextResponse.json({ succeeded, failed });
}
