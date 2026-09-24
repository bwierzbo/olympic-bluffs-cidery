import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { isAiConfigured } from '@/lib/newsletter/config';
import { draftNewsletter } from '@/lib/newsletter/agent';
import type { DraftRequest } from '@/lib/newsletter/types';

// Tool calls plus writing can take a minute.
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  if (!isAiConfigured()) {
    return NextResponse.json({ error: 'AI drafting isn’t connected yet (no AI Gateway credentials).' }, { status: 503 });
  }
  const input = (await request.json().catch(() => ({}))) as Partial<DraftRequest>;
  const brief = (input.brief ?? '').trim();
  if (!brief) return NextResponse.json({ error: 'Tell the assistant what this newsletter is about.' }, { status: 400 });
  if (brief.length > 4000) return NextResponse.json({ error: 'Keep the brief under 4,000 characters.' }, { status: 400 });
  try {
    const draft = await draftNewsletter({ brief, current: input.current, instruction: input.instruction });
    return NextResponse.json(draft);
  } catch (error) {
    console.error('Newsletter draft failed:', error);
    return NextResponse.json(
      { error: 'The assistant couldn’t finish this draft. Try again, or shorten the brief.' },
      { status: 502 }
    );
  }
}
