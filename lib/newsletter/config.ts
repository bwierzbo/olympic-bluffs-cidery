import { Resend } from 'resend';

/**
 * Newsletter settings. RESEND_API_KEY comes from the Resend account (or the
 * Vercel Marketplace integration, which sets the same variable).
 */
export const NEWSLETTER_FROM = process.env.NEWSLETTER_FROM || 'Olympic Bluffs <news@olympicbluffs.com>';
export const NEWSLETTER_REPLY_TO = process.env.NEWSLETTER_REPLY_TO || 'info@olympicbluffs.com';

/** Drafting model, routed through Vercel AI Gateway. */
export const NEWSLETTER_AI_MODEL = process.env.NEWSLETTER_AI_MODEL || 'anthropic/claude-sonnet-5';
/**
 * Used when the primary model is refused (e.g. AI Gateway's free tier does
 * not include Claude models until the team adds paid credits).
 */
export const NEWSLETTER_AI_FALLBACK_MODEL = process.env.NEWSLETTER_AI_FALLBACK_MODEL || 'openai/gpt-5.2';

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** AI Gateway auth: an API key, or the OIDC token Vercel provides (locally via `vercel env pull`). */
export function isAiConfigured(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL === '1');
}

let client: Resend | null = null;
export function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}
