import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const COOKIE_NAME = 'admin_session';

/**
 * Create a signed admin session token.
 * Token format: base64(timestamp:hmac-signature)
 */
export function createAdminToken(): string {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error('ADMIN_PASSWORD not configured');

  const timestamp = Date.now().toString();
  const signature = createHmac('sha256', secret)
    .update(`admin:${timestamp}`)
    .digest('hex');

  return Buffer.from(`${timestamp}:${signature}`).toString('base64');
}

/**
 * Verify a signed admin session token.
 * Checks signature validity and expiration.
 */
export function verifyAdminToken(token: string): boolean {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return false;

  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const colonIndex = decoded.indexOf(':');
    if (colonIndex === -1) return false;

    const timestamp = decoded.substring(0, colonIndex);
    const signature = decoded.substring(colonIndex + 1);
    if (!timestamp || !signature) return false;

    // Check expiration
    const age = Date.now() - parseInt(timestamp, 10);
    if (age > TOKEN_TTL_MS || age < 0) return false;

    // Verify signature using timing-safe comparison
    const expected = createHmac('sha256', secret)
      .update(`admin:${timestamp}`)
      .digest('hex');

    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

/**
 * Middleware: check admin authentication via cookie.
 * Returns a 401 NextResponse if auth fails, or null if auth passes.
 */
export function requireAdmin(request: NextRequest): NextResponse | null {
  const cookie = request.cookies.get(COOKIE_NAME);

  if (!cookie?.value) {
    return NextResponse.json(
      { error: 'AUTH_REQUIRED', detail: 'Authentication required' },
      { status: 401 },
    );
  }

  if (!verifyAdminToken(cookie.value)) {
    return NextResponse.json(
      { error: 'AUTH_INVALID', detail: 'Session expired or invalid. Please log in again.' },
      { status: 401 },
    );
  }

  return null; // auth passed
}

/**
 * Set the admin session cookie on a response.
 */
export function setAdminCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/admin',
    maxAge: TOKEN_TTL_MS / 1000, // maxAge is in seconds
  });
}

/**
 * Clear the admin session cookie on a response.
 */
export function clearAdminCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/admin',
    maxAge: 0,
  });
}
