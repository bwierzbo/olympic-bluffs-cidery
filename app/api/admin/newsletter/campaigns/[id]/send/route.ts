import { after, NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { isResendConfigured } from '@/lib/newsletter/config';
import { toCampaignDTO } from '@/lib/newsletter/data';
import { processCampaignSend, SendError, startCampaignSend } from '@/lib/newsletter/send';

// Batches keep going after the response is returned (see after()); the
// function's own time limit bounds how long that can run.
export const maxDuration = 300;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  if (!isResendConfigured()) return NextResponse.json({ error: 'Sending isn’t connected yet (no Resend key).' }, { status: 503 });
  const { id } = await params;
  try {
    const campaign = await startCampaignSend(id);
    after(async () => {
      try {
        await processCampaignSend(id);
      } catch (error) {
        console.error('Newsletter send failed:', error);
      }
    });
    return NextResponse.json({ campaign: toCampaignDTO(campaign) });
  } catch (error) {
    const status = error instanceof SendError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not start sending.' }, { status });
  }
}
