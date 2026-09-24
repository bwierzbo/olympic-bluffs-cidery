import { prisma } from '@/lib/prisma';
import { getResend, NEWSLETTER_FROM, NEWSLETTER_REPLY_TO } from './config';
import { renderNewsletter, unsubscribeOneClickUrl, unsubscribePageUrl } from './render';

/**
 * Sending a campaign:
 *  1. startCampaignSend() locks the campaign (draft|paused → sending) and, for
 *     a first send, snapshots every subscribed address into a delivery row.
 *  2. processCampaignSend() works through pending deliveries in batches of
 *     100 via Resend's batch API, one personalized unsubscribe link each.
 * If Resend refuses (daily limit, rate limit, bad key) the campaign is paused
 * with the reason; resuming only sends what is still pending, so nobody gets
 * the same email twice.
 */

const BATCH_SIZE = 100;
const PAUSE_BETWEEN_BATCHES_MS = 600; // stay under Resend's request rate limit
/** A campaign stuck in "sending" longer than this was interrupted. */
export const STALE_SENDING_MS = 10 * 60 * 1000;

export class SendError extends Error {
  constructor(
    message: string,
    public status = 409
  ) {
    super(message);
  }
}

export async function startCampaignSend(campaignId: string) {
  const campaign = await prisma.newsletterCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new SendError('Newsletter not found.', 404);
  if (!campaign.subject.trim() || !campaign.body.trim()) throw new SendError('Add a subject and a body before sending.');
  if (campaign.status !== 'draft' && campaign.status !== 'paused') {
    throw new SendError(campaign.status === 'sent' ? 'This newsletter was already sent.' : 'This newsletter is already sending.');
  }

  if (campaign.status === 'draft') {
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { status: 'subscribed' },
      select: { id: true, email: true },
    });
    if (subscribers.length === 0) throw new SendError('There are no subscribers yet.');
    await prisma.newsletterDelivery.createMany({
      data: subscribers.map((s) => ({ campaignId, subscriberId: s.id, email: s.email })),
      skipDuplicates: true,
    });
  }

  const recipientCount = await prisma.newsletterDelivery.count({ where: { campaignId } });
  // Compare-and-set so two clicks can't start two senders.
  const locked = await prisma.newsletterCampaign.updateMany({
    where: { id: campaignId, status: { in: ['draft', 'paused'] } },
    data: { status: 'sending', lastError: null, recipientCount },
  });
  if (locked.count === 0) throw new SendError('This newsletter is already sending.');
  return prisma.newsletterCampaign.findUniqueOrThrow({ where: { id: campaignId } });
}

function friendlyResendError(name: string | undefined, message: string | undefined): string {
  switch (name) {
    case 'daily_quota_exceeded':
      return 'Resend’s daily sending limit was reached. Resume tomorrow to send the rest.';
    case 'monthly_quota_exceeded':
      return 'Resend’s monthly sending limit was reached. Upgrade the plan or resume next month.';
    case 'rate_limit_exceeded':
      return 'Resend asked us to slow down. Resume in a minute to send the rest.';
    case 'missing_api_key':
    case 'invalid_api_key':
    case 'restricted_api_key':
      return 'The Resend API key is missing or invalid.';
    case 'invalid_from_address':
    case 'validation_error':
      return `Resend rejected the email: ${message ?? 'check the sending domain is verified'}.`;
    default:
      return message || 'Resend could not send this batch.';
  }
}

async function refreshCounts(campaignId: string) {
  const [sent, failed, pending] = await Promise.all([
    prisma.newsletterDelivery.count({ where: { campaignId, status: 'sent' } }),
    prisma.newsletterDelivery.count({ where: { campaignId, status: 'failed' } }),
    prisma.newsletterDelivery.count({ where: { campaignId, status: 'pending' } }),
  ]);
  await prisma.newsletterCampaign.update({
    where: { id: campaignId },
    data: { sentCount: sent, failedCount: failed },
  });
  return { sent, failed, pending };
}

async function pause(campaignId: string, reason: string) {
  await prisma.newsletterCampaign.update({ where: { id: campaignId }, data: { status: 'paused', lastError: reason } });
}

export async function processCampaignSend(campaignId: string): Promise<void> {
  const campaign = await prisma.newsletterCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign || campaign.status !== 'sending') return;
  const resend = getResend();

  for (;;) {
    const batch = await prisma.newsletterDelivery.findMany({
      where: { campaignId, status: 'pending' },
      include: { subscriber: true },
      orderBy: { id: 'asc' },
      take: BATCH_SIZE,
    });
    if (batch.length === 0) break;

    // Anyone who unsubscribed after the send started is skipped.
    const skip = batch.filter((d) => d.subscriber.status !== 'subscribed');
    if (skip.length > 0) {
      await prisma.newsletterDelivery.updateMany({
        where: { id: { in: skip.map((d) => d.id) } },
        data: { status: 'skipped', error: 'Unsubscribed before delivery' },
      });
    }
    const send = batch.filter((d) => d.subscriber.status === 'subscribed');
    if (send.length === 0) continue;

    const emails = send.map((d) => {
      const { html, text } = renderNewsletter({
        subject: campaign.subject,
        previewText: campaign.previewText,
        body: campaign.body,
        unsubscribeUrl: unsubscribePageUrl(d.subscriber.unsubscribeToken),
      });
      return {
        from: NEWSLETTER_FROM,
        to: d.email,
        replyTo: NEWSLETTER_REPLY_TO,
        subject: campaign.subject,
        html,
        text,
        headers: {
          'List-Unsubscribe': `<${unsubscribeOneClickUrl(d.subscriber.unsubscribeToken)}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      };
    });

    let response;
    try {
      response = await resend.batch.send(emails, {
        batchValidation: 'permissive',
        idempotencyKey: `newsletter-${campaignId}-${send[0].id}-${send.length}`,
      });
    } catch (error) {
      await pause(campaignId, error instanceof Error ? error.message : 'Could not reach Resend.');
      await refreshCounts(campaignId);
      return;
    }

    if (response.error) {
      await pause(campaignId, friendlyResendError(response.error.name, response.error.message));
      await refreshCounts(campaignId);
      return;
    }

    const failedAt = new Map<number, string>();
    const errors = (response.data as { errors?: Array<{ index: number; message: string }> }).errors ?? [];
    for (const e of errors) failedAt.set(e.index, e.message);
    // Resend returns ids for accepted emails in order, skipping failed indexes.
    const ids = response.data.data.map((d) => d.id);
    let idCursor = 0;
    const now = new Date();
    await prisma.$transaction(
      send.map((d, i) =>
        failedAt.has(i)
          ? prisma.newsletterDelivery.update({ where: { id: d.id }, data: { status: 'failed', error: failedAt.get(i) } })
          : prisma.newsletterDelivery.update({
              where: { id: d.id },
              data: { status: 'sent', resendId: ids[idCursor++] ?? null, sentAt: now },
            })
      )
    );
    await refreshCounts(campaignId);
    await new Promise((r) => setTimeout(r, PAUSE_BETWEEN_BATCHES_MS));
  }

  await refreshCounts(campaignId);
  await prisma.newsletterCampaign.update({
    where: { id: campaignId },
    data: { status: 'sent', sentAt: new Date(), lastError: null },
  });
}

/** Send one copy to an address, e.g. the owners' own inbox, without touching the subscriber list. */
export async function sendTestEmail(campaign: { subject: string; previewText: string; body: string }, to: string) {
  const { html, text } = renderNewsletter({ ...campaign });
  const response = await getResend().emails.send({
    from: NEWSLETTER_FROM,
    to,
    replyTo: NEWSLETTER_REPLY_TO,
    subject: `[Test] ${campaign.subject || 'Untitled newsletter'}`,
    html,
    text,
  });
  if (response.error) throw new SendError(friendlyResendError(response.error.name, response.error.message), 502);
}

/** Campaigns whose sender died mid-way (function timeout, deploy) become resumable. */
export async function markStaleSends(): Promise<void> {
  await prisma.newsletterCampaign.updateMany({
    where: { status: 'sending', updatedAt: { lt: new Date(Date.now() - STALE_SENDING_MS) } },
    data: { status: 'paused', lastError: 'Sending was interrupted. Resume to send the rest.' },
  });
}
