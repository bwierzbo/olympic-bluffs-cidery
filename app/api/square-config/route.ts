import { NextResponse } from 'next/server';
import { getSquarePublicConfig } from '@/lib/square';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getSquarePublicConfig());
}
