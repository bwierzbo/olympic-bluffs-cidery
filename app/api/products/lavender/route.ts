import { NextResponse } from 'next/server';
import { getLavenderProducts } from '@/lib/lavender-products';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await getLavenderProducts();
    return NextResponse.json({ success: true, products });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error fetching lavender products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products', details: err.message },
      { status: 500 }
    );
  }
}
