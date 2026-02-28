import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getOrderAuditLogPaginated } from '@/lib/orders';

/**
 * GET /api/admin/orders/[orderId]/audit
 * Paginated audit log for an order.
 *
 * Query params: page, pageSize, action (optional filter)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { orderId } = await params;
  const url = request.nextUrl;

  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '50', 10)));
  const action = url.searchParams.get('action') || undefined;

  const result = await getOrderAuditLogPaginated(orderId, page, pageSize, action);

  if (!result) {
    return NextResponse.json(
      { error: 'NOT_FOUND', detail: `Order '${orderId}' not found` },
      { status: 404 },
    );
  }

  return NextResponse.json(result);
}
