import { NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/ciders';

/**
 * Slim cider list for client components (name → slug lookups). Content
 * itself lives in VinoShipper; see lib/ciders.ts.
 */
export async function GET() {
  try {
    const ciders = await getAllProducts();
    return NextResponse.json({
      success: true,
      ciders: ciders.map((c) => ({ slug: c.slug, name: c.name, vinoshipperId: c.vinoshipperId })),
    });
  } catch (error) {
    console.error('Cider list unavailable:', error);
    return NextResponse.json({ success: false, ciders: [] }, { status: 503 });
  }
}
