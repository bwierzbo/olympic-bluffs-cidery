import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getOrder, updateOrderStatus } from '@/lib/orders';
import { validateTransition } from '@/lib/status-transitions';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@/lib/types';
import { sendProcessingEmail, sendReadyForPickupEmail, sendShippedEmail, sendCompletedEmail } from '@/lib/email';

/**
 * POST /api/admin/orders/[orderId]/status
 * Update order status with transition validation, audit log, and email notifications.
 *
 * Body: { status: OrderStatus, note?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { orderId } = await params;

  let body: { status?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'INVALID_JSON', detail: 'Request body must be valid JSON' },
      { status: 400 },
    );
  }

  const { status: newStatus, note } = body;

  if (!newStatus) {
    return NextResponse.json(
      { error: 'MISSING_FIELD', detail: "'status' is required" },
      { status: 400 },
    );
  }

  // Fetch current order
  const order = await getOrder(orderId);
  if (!order) {
    return NextResponse.json(
      { error: 'NOT_FOUND', detail: `Order '${orderId}' not found` },
      { status: 404 },
    );
  }

  // Validate transition
  const validation = validateTransition(
    { status: order.status, fulfillmentMethod: order.fulfillmentMethod },
    newStatus as OrderStatus,
    note,
  );

  if (!validation.valid) {
    return NextResponse.json(
      {
        error: validation.errorCode,
        detail: validation.detail,
        allowedTransitions: validation.allowedTransitions,
      },
      { status: 422 },
    );
  }

  const fromStatus = order.status;

  // Update order status (appends to statusHistory JSON for backward compat)
  const updatedOrder = await updateOrderStatus(orderId, newStatus as OrderStatus, note);

  if (!updatedOrder) {
    return NextResponse.json(
      { error: 'UPDATE_FAILED', detail: 'Failed to update order status' },
      { status: 500 },
    );
  }

  // Create audit log entry
  await prisma.orderAuditLog.create({
    data: {
      orderId,
      action: 'status_change',
      actor: 'admin',
      fromStatus,
      toStatus: newStatus,
      note: note || null,
    },
  });

  // Fire-and-forget email notifications based on new status
  try {
    switch (newStatus) {
      case 'processing':
        sendProcessingEmail(updatedOrder).catch(err =>
          console.error('Failed to send processing email:', err),
        );
        break;
      case 'ready':
        sendReadyForPickupEmail(updatedOrder).catch(err =>
          console.error('Failed to send ready-for-pickup email:', err),
        );
        break;
      case 'shipped':
        sendShippedEmail(updatedOrder).catch(err =>
          console.error('Failed to send shipped email:', err),
        );
        break;
      case 'completed':
        sendCompletedEmail(updatedOrder).catch(err =>
          console.error('Failed to send completed email:', err),
        );
        break;
    }
  } catch (err) {
    // Email failures should not fail the status update
    console.error('Email notification error:', err);
  }

  return NextResponse.json({
    order: updatedOrder,
    transition: { from: fromStatus, to: newStatus },
  });
}
