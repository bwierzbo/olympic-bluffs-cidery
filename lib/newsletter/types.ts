/**
 * Shapes shared by the newsletter admin API (app/api/admin/newsletter/*) and
 * the admin UI (app/admin/newsletter/*). Dates are ISO strings.
 */

export type SubscriberStatus = 'subscribed' | 'unsubscribed';

export interface SubscriberDTO {
  id: string;
  email: string;
  status: SubscriberStatus;
  source: string | null;
  createdAt: string;
  unsubscribedAt: string | null;
}

/** draft → sending → sent. "paused" = sending stopped partway (e.g. the daily limit); resume sends only the rest. */
export type CampaignStatus = 'draft' | 'sending' | 'sent' | 'paused';

export interface CampaignDTO {
  id: string;
  subject: string;
  previewText: string;
  /** Markdown */
  body: string;
  status: CampaignStatus;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  lastError: string | null;
  aiBrief: string | null;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
}

export interface DraftRequest {
  /** What the email should be about, in the owners' words. */
  brief: string;
  /** Current draft, when asking for a revision. */
  current?: { subject: string; previewText: string; body: string };
  /** Revision instruction, e.g. "shorter, and mention the pack". */
  instruction?: string;
}

export interface DraftResult {
  subject: string;
  previewText: string;
  /** Markdown */
  body: string;
  /** Things the agent wants the owners to check (facts it could not verify, placeholders). */
  notes: string[];
}

export interface NewsletterStatusDTO {
  /** RESEND_API_KEY is set */
  resendConfigured: boolean;
  fromAddress: string;
  /** AI Gateway credentials present (AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN) */
  aiConfigured: boolean;
  subscribedCount: number;
}
