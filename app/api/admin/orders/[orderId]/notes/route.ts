import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * POST /api/admin/orders/[orderId]/notes
 * Add or update admin notes for an order + create audit log entry.
 *
 * Body: { note: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { orderId } = await params;

  let body: { note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'INVALID_JSON', detail: 'Request body must be valid JSON' },
      { status: 400 },
    );
  }

  const { note } = body;

  if (!note || !note.trim()) {
    return NextResponse.json(
      { error: 'MISSING_FIELD', detail: "'note' is required" },
      { status: 400 },
    );
  }

  // Fetch the order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, adminNotes: true },
  });

  if (!order) {
    return NextResponse.json(
      { error: 'NOT_FOUND', detail: `Order '${orderId}' not found` },
      { status: 404 },
    );
  }

  // Update admin notes (replaces existing notes)
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { adminNotes: note.trim() },
  });

  // Create audit log entry
  await prisma.orderAuditLog.create({
    data: {
      orderId,
      action: 'note_added',
      actor: 'admin',
      note: note.trim(),
      metadata: order.adminNotes ? { previousNote: order.adminNotes } : Prisma.JsonNull,
    },
  });

  return NextResponse.json({
    orderId: updated.id,
    adminNotes: updated.adminNotes,
  });
}
