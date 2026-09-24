import type { NewsletterCampaign, NewsletterSubscriber } from '@prisma/client';
import type { CampaignDTO, CampaignStatus, SubscriberDTO, SubscriberStatus } from './types';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function toSubscriberDTO(s: NewsletterSubscriber): SubscriberDTO {
  return {
    id: s.id,
    email: s.email,
    status: s.status as SubscriberStatus,
    source: s.source,
    createdAt: s.createdAt.toISOString(),
    unsubscribedAt: s.unsubscribedAt?.toISOString() ?? null,
  };
}

export function toCampaignDTO(c: NewsletterCampaign): CampaignDTO {
  return {
    id: c.id,
    subject: c.subject,
    previewText: c.previewText,
    body: c.body,
    status: c.status as CampaignStatus,
    recipientCount: c.recipientCount,
    sentCount: c.sentCount,
    failedCount: c.failedCount,
    lastError: c.lastError,
    aiBrief: c.aiBrief,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    sentAt: c.sentAt?.toISOString() ?? null,
  };
}
