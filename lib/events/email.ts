import type { Event, EventRegistration } from '@prisma/client';
import { buildIcs, farmInbox, sendTransactional } from '@/lib/mailer';
import { renderTransactionalEmail } from '@/lib/newsletter/render';
import { SITE_URL } from '@/lib/site-url';
import { getSiteConfig } from '@/lib/site-config';
import { formatDay, formatTimeRange, money } from './service';

/** Emails sent to attendees (and a copy to the farm). Failures are logged, never thrown. */

function when(e: Event) {
  return `${formatDay(e.startsAt)}, ${formatTimeRange(e.startsAt, e.endsAt)}`;
}

function address() {
  const { contact } = getSiteConfig();
  return `${contact.address1}, ${contact.city}, ${contact.state} ${contact.zip}`;
}

export function eventIcs(e: Event): string {
  return buildIcs({
    uid: `event-${e.id}@olympicbluffs.com`,
    title: `${e.title} at Olympic Bluffs`,
    description: `${e.location ? `Meet at: ${e.location}\n` : ''}${SITE_URL}/events/${e.slug}`,
    location: `Olympic Bluffs Cidery & Lavender Farm, ${address()}`,
    start: e.startsAt,
    end: e.endsAt,
  });
}

async function send(to: string, subject: string, previewText: string, body: string, withIcs?: Event) {
  // People added by hand may have no email address.
  if (!to?.trim()) return false;
  const { html, text } = renderTransactionalEmail({ title: subject, previewText, body });
  try {
    return await sendTransactional({
      to,
      subject,
      html,
      text,
      attachments: withIcs ? [{ filename: 'event.ics', content: eventIcs(withIcs), contentType: 'text/calendar' }] : undefined,
    });
  } catch (error) {
    console.error('Event email failed:', subject, error);
    return false;
  }
}

const seatsWord = (n: number) => `${n} seat${n === 1 ? '' : 's'}`;

export async function sendRegistrationConfirmation(e: Event, r: EventRegistration) {
  const paid = r.amountPaid > 0 ? `Paid: ${money(r.amountPaid)}` : 'No payment needed';
  const body = `You’re registered for **${e.title}**. We’re looking forward to seeing you.

- **When:** ${when(e)}
- **Where:** ${e.location || 'Olympic Bluffs'}, ${address()}
- **Seats:** ${r.seats}
- **${paid}**
${e.requires21 ? '- Bring a photo ID; this event is 21 and over.\n' : ''}
${e.refundPolicy ? `Refunds: ${e.refundPolicy}\n\n` : ''}A calendar invite is attached. [Event details and directions](${SITE_URL}/events/${e.slug})

— Scott & Ginger`;
  await send(r.email, `You’re registered: ${e.title}`, `${when(e)} · ${seatsWord(r.seats)}`, body, e);
  await send(
    farmInbox(),
    `New registration: ${e.title} (${seatsWord(r.seats)})`,
    `${r.name}, ${r.email}`,
    `**${r.name}** registered for **${e.title}** (${when(e)}).

- Seats: ${r.seats}
- Paid: ${money(r.amountPaid)}
- Email: ${r.email}
${r.phone ? `- Phone: ${r.phone}\n` : ''}
[Open the roster](${SITE_URL}/admin/events/${e.id}?tab=registrations)`
  );
}

export async function sendWaitlistConfirmation(e: Event, r: EventRegistration) {
  await send(
    r.email,
    `You’re on the waitlist: ${e.title}`,
    `We’ll email you if a spot opens.`,
    `You’re on the waitlist for **${e.title}** (${when(e)}) for ${seatsWord(r.seats)}.

If a spot opens up we’ll email you right away. Nothing has been charged.

— Scott & Ginger`
  );
}

export async function sendReminder(e: Event, r: EventRegistration) {
  await send(
    r.email,
    `Reminder: ${e.title}, ${formatDay(e.startsAt)}`,
    `${when(e)} at ${e.location || 'Olympic Bluffs'}`,
    `A quick reminder that **${e.title}** is coming up. We’ll see you on ${formatDay(e.startsAt)}.

- **When:** ${when(e)}
- **Where:** ${e.location || 'Olympic Bluffs'}, ${address()}
- **Seats:** ${r.seats}
${e.requires21 ? '- Bring a photo ID; this event is 21 and over.\n' : ''}
[Directions and details](${SITE_URL}/visit)

— Scott & Ginger`,
    e
  );
}

export async function sendRegistrationCancelled(e: Event, r: EventRegistration, refunded: boolean, note?: string) {
  const refund = refunded
    ? `We’ve refunded ${money(r.amountPaid)} to your card. It usually shows up in 5–10 business days.`
    : r.amountPaid > 0
      ? 'If you have questions about a refund, reply to this email.'
      : '';
  await send(
    r.email,
    `Cancelled: ${e.title}`,
    `Your registration for ${formatDay(e.startsAt)} has been cancelled.`,
    `Your registration for **${e.title}** (${when(e)}) has been cancelled.

${note ? `${note}\n\n` : ''}${refund}

— Scott & Ginger`
  );
}

export async function sendEventCancelled(e: Event, r: EventRegistration, refunded: boolean, message?: string) {
  const refund = refunded
    ? `We’ve refunded ${money(r.amountPaid)} to your card. It usually shows up in 5–10 business days.`
    : r.amountPaid > 0
      ? 'We’ll be in touch about your refund.'
      : '';
  await send(
    r.email,
    `Event cancelled: ${e.title}`,
    `We’re sorry, ${e.title} on ${formatDay(e.startsAt)} is cancelled.`,
    `We’re sorry to say **${e.title}** on ${when(e)} has been cancelled.

${message ? `${message}\n\n` : ''}${refund}

— Scott & Ginger`
  );
}

export async function sendAttendeeMessage(e: Event, r: EventRegistration, subject: string, bodyText: string) {
  return send(r.email, subject, `About ${e.title}, ${formatDay(e.startsAt)}`, `${bodyText.trim()}

— Scott & Ginger

[${e.title}, ${when(e)}](${SITE_URL}/events/${e.slug})`);
}
