import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getOrdersPaginated } from '@/lib/orders';

/**
 * GET /api/admin/orders
 * Paginated order list with filtering, sorting, search, and tab counts.
 */
export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const url = request.nextUrl;

  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '20', 10)));

  const result = await getOrdersPaginated({
    page,
    pageSize,
    status: url.searchParams.get('status') || undefined,
    fulfillment: url.searchParams.get('fulfillment') || undefined,
    search: url.searchParams.get('search') || undefined,
    dateFrom: url.searchParams.get('dateFrom') || undefined,
    dateTo: url.searchParams.get('dateTo') || undefined,
    sortBy: url.searchParams.get('sortBy') || undefined,
    sortOrder: url.searchParams.get('sortOrder') || undefined,
    tab: url.searchParams.get('tab') || undefined,
  });

  return NextResponse.json(result);
}
