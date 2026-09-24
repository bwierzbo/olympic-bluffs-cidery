import { NextResponse } from 'next/server';
import { EventError } from './service';

/** Shared error handling for the admin events routes. */
export function errorResponse(error: unknown, fallback = 'Something went wrong.') {
  if (error instanceof EventError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error(fallback, error);
  const message =
    (error as { errors?: Array<{ detail?: string }> })?.errors?.[0]?.detail ||
    (error instanceof Error ? error.message : fallback);
  return NextResponse.json({ error: message || fallback }, { status: 500 });
}
