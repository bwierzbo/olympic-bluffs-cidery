import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getOrderWithAuditLog } from '@/lib/orders';

/**
 * GET /api/admin/orders/[orderId]
 * Full order detail with nested audit log.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { orderId } = await params;
  const result = await getOrderWithAuditLog(orderId);

  if (!result) {
    return NextResponse.json(
      { error: 'NOT_FOUND', detail: `Order '${orderId}' not found` },
      { status: 404 },
    );
  }

  return NextResponse.json(result);
}
