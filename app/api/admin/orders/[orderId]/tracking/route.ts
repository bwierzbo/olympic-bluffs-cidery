import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/admin/orders/[orderId]/tracking
 * Set tracking number for a shipping order + create audit log entry.
 *
 * Body: { trackingNumber: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { orderId } = await params;

  let body: { trackingNumber?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'INVALID_JSON', detail: 'Request body must be valid JSON' },
      { status: 400 },
    );
  }

  const { trackingNumber } = body;

  if (!trackingNumber || !trackingNumber.trim()) {
    return NextResponse.json(
      { error: 'MISSING_FIELD', detail: "'trackingNumber' is required" },
      { status: 400 },
    );
  }

  // Fetch the order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, fulfillmentMethod: true, trackingNumber: true },
  });

  if (!order) {
    return NextResponse.json(
      { error: 'NOT_FOUND', detail: `Order '${orderId}' not found` },
      { status: 404 },
    );
  }

  if (order.fulfillmentMethod !== 'shipping') {
    return NextResponse.json(
      { error: 'FULFILLMENT_MISMATCH', detail: 'Tracking numbers can only be set on shipping orders' },
      { status: 422 },
    );
  }

  const previousTracking = order.trackingNumber;

  // Update the tracking number
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { trackingNumber: trackingNumber.trim() },
  });

  // Create audit log entry
  await prisma.orderAuditLog.create({
    data: {
      orderId,
      action: 'tracking_added',
      actor: 'admin',
      note: previousTracking
        ? `Tracking number updated from '${previousTracking}' to '${trackingNumber.trim()}'`
        : `Tracking number set to '${trackingNumber.trim()}'`,
      metadata: { trackingNumber: trackingNumber.trim(), previousTracking },
    },
  });

  return NextResponse.json({
    orderId: updated.id,
    trackingNumber: updated.trackingNumber,
  });
}
