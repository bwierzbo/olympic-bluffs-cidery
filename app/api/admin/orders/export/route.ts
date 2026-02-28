import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getOrdersPaginated } from '@/lib/orders';
import { formatOrdersAsCsv } from '@/lib/csv-export';

/**
 * GET /api/admin/orders/export
 * CSV export of orders matching current filter criteria.
 * Accepts the same query params as the list endpoint.
 */
export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const url = request.nextUrl;

  // Fetch all matching orders (no pagination limit for export)
  const result = await getOrdersPaginated({
    page: 1,
    pageSize: 10000, // reasonable upper bound for CSV
    status: url.searchParams.get('status') || undefined,
    fulfillment: url.searchParams.get('fulfillment') || undefined,
    search: url.searchParams.get('search') || undefined,
    dateFrom: url.searchParams.get('dateFrom') || undefined,
    dateTo: url.searchParams.get('dateTo') || undefined,
    sortBy: url.searchParams.get('sortBy') || undefined,
    sortOrder: url.searchParams.get('sortOrder') || undefined,
    tab: url.searchParams.get('tab') || undefined,
  });

  const csv = formatOrdersAsCsv(result.data);
  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="orders-export-${today}.csv"`,
    },
  });
}
