import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { renderNewsletter } from '@/lib/newsletter/render';

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const input = (await request.json().catch(() => ({}))) as { subject?: string; previewText?: string; body?: string };
  const { html } = renderNewsletter({
    subject: input.subject ?? '',
    previewText: input.previewText ?? '',
    body: input.body ?? '',
  });
  return NextResponse.json({ html });
}
