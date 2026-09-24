import nodemailer from 'nodemailer';
import { Resend } from 'resend';

/**
 * Shared transactional mail helper. Order emails in lib/email.ts predate
 * this and keep their own transporter; new templates (event confirmations,
 * reminders, refunds in Phase 6) should send through here.
 */

export interface MailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** Optional attachments, e.g. an .ics calendar file for an event. */
  attachments?: Array<{ filename: string; content: string; contentType?: string }>;
}

const FROM_NAME = 'Olympic Bluffs Cidery & Lavender Farm';

function transporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

export function isMailConfigured(): boolean {
  return Boolean(
    process.env.GMAIL_USER &&
      process.env.GMAIL_APP_PASSWORD &&
      process.env.GMAIL_APP_PASSWORD !== 'your-app-password-here'
  );
}

export async function sendMail(message: MailMessage): Promise<boolean> {
  if (!isMailConfigured()) {
    console.log(`[mailer] not configured; would send "${message.subject}" to ${message.to}`);
    return false;
  }
  try {
    await transporter().sendMail({
      from: `"${FROM_NAME}" <${process.env.GMAIL_USER}>`,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      replyTo: message.replyTo,
      attachments: message.attachments,
    });
    return true;
  } catch (error) {
    console.error('[mailer] send failed:', error);
    return false;
  }
}

/** Address that receives a copy of every order and registration. */
export function farmInbox(): string {
  return process.env.GMAIL_USER || 'info@olympicbluffs.com';
}

/**
 * Minimal iCalendar file for "Add to calendar" links in event emails.
 * Times are passed as Date objects and written in UTC.
 */
export function buildIcs(input: {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
}): string {
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Olympic Bluffs//Events//EN',
    'BEGIN:VEVENT',
    `UID:${input.uid}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(input.start)}`,
    `DTEND:${stamp(input.end)}`,
    `SUMMARY:${esc(input.title)}`,
    input.description ? `DESCRIPTION:${esc(input.description)}` : '',
    `LOCATION:${esc(input.location ?? '1025 Finn Hall Road, Port Angeles, WA 98362')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

/**
 * Transactional mail for events. Prefers Resend (verified olympicbluffs.com
 * domain, better delivery); falls back to the Gmail account used for order
 * emails when RESEND_API_KEY isn't set (e.g. local development).
 */
export const EVENTS_FROM = process.env.EVENTS_FROM || 'Olympic Bluffs <events@olympicbluffs.com>';
export const EVENTS_REPLY_TO = process.env.EVENTS_REPLY_TO || 'info@olympicbluffs.com';

let resendClient: Resend | null = null;

export async function sendTransactional(message: MailMessage): Promise<boolean> {
  if (process.env.RESEND_API_KEY) {
    resendClient ??= new Resend(process.env.RESEND_API_KEY);
    const res = await resendClient.emails.send({
      from: EVENTS_FROM,
      to: message.to,
      replyTo: message.replyTo ?? EVENTS_REPLY_TO,
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments: message.attachments?.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content).toString('base64'),
        contentType: a.contentType,
      })),
    });
    if (res.error) {
      console.error('[mailer] Resend send failed:', res.error);
      return false;
    }
    return true;
  }
  return sendMail(message);
}
