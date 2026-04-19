import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getSquareMode, setSquareMode, SquareMode } from '@/lib/square';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  return NextResponse.json({ mode: getSquareMode() });
}

export async function POST(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { mode } = await request.json();

  if (mode !== 'sandbox' && mode !== 'production') {
    return NextResponse.json({ error: 'Mode must be "sandbox" or "production"' }, { status: 400 });
  }

  setSquareMode(mode as SquareMode);
  console.log(`Square mode switched to: ${mode}`);

  return NextResponse.json({ mode: getSquareMode() });
}
