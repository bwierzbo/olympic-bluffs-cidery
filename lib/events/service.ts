import { randomUUID } from 'crypto';
import type { Event, EventRegistration, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { chargeCard, describeDecline } from '@/lib/payments';
import { getSquareClient, getSquarePublicConfig } from '@/lib/square';
import type {
  AdminEventDTO,
  EventInput,
  PublicEventDTO,
  RegisterErrorCode,
  RegisterRequest,
  RegistrationDTO,
  RegistrationStatus,
  EventStatus,
} from './types';

/**
 * Ticketed events (classes, tastings, workshops) created in the admin.
 *
 * Selling a seat:
 *  1. In one transaction, lock the event row, count seats held by confirmed
 *     registrations plus unexpired pending holds, and insert a pending
 *     registration holding the seats (free events go straight to confirmed).
 *  2. Create an itemized Square order and charge the card against it,
 *     outside the transaction (idempotent on the registration id).
 *  3. Mark it confirmed, or delete the hold if the card was declined.
 * A crashed request leaves a pending hold that expires after HOLD_MINUTES, so
 * seats are never lost for good and can never be sold twice.
 */

export const HOLD_MINUTES = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TZ = 'America/Los_Angeles';

export class EventError extends Error {
  constructor(
    message: string,
    public status = 400,
    public code?: RegisterErrorCode,
    public extra?: Record<string, unknown>
  ) {
    super(message);
  }
}

// ---------------------------------------------------------------- helpers

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function pacificDate(iso: Date | string): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(iso)
  );
  return parts; // YYYY-MM-DD
}

/** "Saturday, October 11" */
export function formatDay(iso: Date | string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(iso));
}

function fmtTime(iso: Date | string): string {
  const s = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' })
    .format(new Date(iso))
    .toLowerCase();
  return s.replace(':00', '').replace(/\s?([ap])m/, ' $1m');
}

/** "10 am – 1 pm" */
export function formatTimeRange(start: Date | string, end: Date | string): string {
  const a = fmtTime(start);
  const b = fmtTime(end);
  const sameHalf = a.slice(-2) === b.slice(-2);
  return `${sameHalf ? a.slice(0, -3) : a} – ${b}`;
}

export function money(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`;
}

/** Seats held right now: confirmed + pending holds that haven't expired. */
async function seatsTakenFor(eventIds: string[], db: Prisma.TransactionClient | typeof prisma = prisma): Promise<Map<string, number>> {
  const now = new Date();
  const rows = await db.eventRegistration.groupBy({
    by: ['eventId'],
    _sum: { seats: true },
    where: {
      eventId: { in: eventIds },
      OR: [{ status: 'confirmed' }, { status: 'pending', holdExpiresAt: { gt: now } }],
    },
  });
  return new Map(rows.map((r) => [r.eventId, r._sum.seats ?? 0]));
}

function registrationState(event: Event, seatsLeft: number): PublicEventDTO['registration'] {
  if (event.status === 'cancelled') return 'cancelled';
  const closes = event.registrationClosesAt ?? event.startsAt;
  if (Date.now() >= closes.getTime()) return 'closed';
  if (seatsLeft <= 0) return 'sold_out';
  return 'open';
}

// ------------------------------------------------------------ mapping DTOs

export function toRegistrationDTO(r: EventRegistration): RegistrationDTO {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    seats: r.seats,
    amountPaid: r.amountPaid,
    paymentId: r.paymentId,
    refundId: r.refundId,
    status: r.status as RegistrationStatus,
    checkedInAt: r.checkedInAt?.toISOString() ?? null,
    adminNotes: r.adminNotes,
    createdAt: r.createdAt.toISOString(),
  };
}

function inputFields(e: Event): EventInput {
  return {
    title: e.title,
    description: e.description,
    image: e.image,
    imageAlt: e.imageAlt,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt.toISOString(),
    location: e.location,
    capacity: e.capacity,
    pricePerSeat: e.pricePerSeat,
    maxSeatsPerOrder: e.maxSeatsPerOrder,
    requires21: e.requires21,
    waitlistEnabled: e.waitlistEnabled,
    registrationClosesAt: e.registrationClosesAt?.toISOString() ?? null,
    refundPolicy: e.refundPolicy,
  };
}

export async function toAdminDTOs(events: Event[]): Promise<AdminEventDTO[]> {
  if (events.length === 0) return [];
  const ids = events.map((e) => e.id);
  const [taken, stats] = await Promise.all([
    seatsTakenFor(ids),
    prisma.eventRegistration.groupBy({
      by: ['eventId', 'status'],
      _count: { id: true },
      _sum: { amountPaid: true },
      where: { eventId: { in: ids } },
    }),
  ]);
  return events.map((e) => {
    const mine = stats.filter((s) => s.eventId === e.id);
    const confirmed = mine.find((s) => s.status === 'confirmed');
    const seatsTaken = taken.get(e.id) ?? 0;
    return {
      ...inputFields(e),
      id: e.id,
      slug: e.slug,
      status: e.status as EventStatus,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      seatsTaken,
      seatsLeft: Math.max(0, e.capacity - seatsTaken),
      confirmedCount: confirmed?._count.id ?? 0,
      waitlistCount: mine.find((s) => s.status === 'waitlist')?._count.id ?? 0,
      revenueCents: confirmed?._sum.amountPaid ?? 0,
    };
  });
}

export async function toAdminDTO(event: Event): Promise<AdminEventDTO> {
  return (await toAdminDTOs([event]))[0];
}

export async function toPublicDTOs(events: Event[]): Promise<PublicEventDTO[]> {
  if (events.length === 0) return [];
  const taken = await seatsTakenFor(events.map((e) => e.id));
  return events.map((e) => {
    const seatsLeft = Math.max(0, e.capacity - (taken.get(e.id) ?? 0));
    return {
      slug: e.slug,
      title: e.title,
      description: e.description,
      image: e.image,
      imageAlt: e.imageAlt,
      startsAt: e.startsAt.toISOString(),
      endsAt: e.endsAt.toISOString(),
      location: e.location,
      pricePerSeat: e.pricePerSeat,
      maxSeatsPerOrder: e.maxSeatsPerOrder,
      requires21: e.requires21,
      waitlistEnabled: e.waitlistEnabled,
      refundPolicy: e.refundPolicy,
      seatsLeft,
      capacity: e.capacity,
      registration: registrationState(e, seatsLeft),
    };
  });
}

// ----------------------------------------------------------- admin editing

function parseDate(v: unknown, field: string): Date {
  const d = new Date(String(v));
  if (!v || Number.isNaN(d.getTime())) throw new EventError(`${field} is not a valid date.`);
  return d;
}

/** Validates and normalizes (partial) input into Prisma data. */
export function eventData(input: Partial<EventInput>, existing?: Event): Prisma.EventUncheckedUpdateInput {
  const data: Prisma.EventUncheckedUpdateInput = {};
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const int = (v: unknown, field: string, min: number) => {
    const n = Number(v);
    if (!Number.isInteger(n) || n < min) throw new EventError(`${field} must be a whole number of at least ${min}.`);
    return n;
  };

  if (input.title !== undefined) {
    if (!str(input.title)) throw new EventError('Give the event a title.');
    data.title = str(input.title).slice(0, 140);
  }
  if (input.description !== undefined) data.description = String(input.description ?? '').slice(0, 10000);
  if (input.image !== undefined) data.image = str(input.image) || null;
  if (input.imageAlt !== undefined) data.imageAlt = str(input.imageAlt) || null;
  if (input.location !== undefined) data.location = str(input.location).slice(0, 140);
  if (input.startsAt !== undefined) data.startsAt = parseDate(input.startsAt, 'Start');
  if (input.endsAt !== undefined) data.endsAt = parseDate(input.endsAt, 'End');
  if (input.capacity !== undefined) data.capacity = int(input.capacity, 'Capacity', 1);
  if (input.pricePerSeat !== undefined) data.pricePerSeat = int(input.pricePerSeat, 'Price', 0);
  if (input.maxSeatsPerOrder !== undefined) data.maxSeatsPerOrder = int(input.maxSeatsPerOrder, 'Max seats per order', 1);
  if (input.requires21 !== undefined) data.requires21 = Boolean(input.requires21);
  if (input.waitlistEnabled !== undefined) data.waitlistEnabled = Boolean(input.waitlistEnabled);
  if (input.registrationClosesAt !== undefined)
    data.registrationClosesAt = input.registrationClosesAt ? parseDate(input.registrationClosesAt, 'Registration close') : null;
  if (input.refundPolicy !== undefined) data.refundPolicy = str(input.refundPolicy) || null;

  const start = (data.startsAt as Date | undefined) ?? existing?.startsAt;
  const end = (data.endsAt as Date | undefined) ?? existing?.endsAt;
  if (start && end && end.getTime() <= start.getTime()) throw new EventError('The event has to end after it starts.');
  return data;
}

async function uniqueSlug(title: string, startsAt: Date, exceptId?: string): Promise<string> {
  const base = `${slugify(title) || 'event'}-${pacificDate(startsAt)}`;
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? base : `${base}-${i + 1}`;
    if (slug === 'lavender-festival') continue;
    const hit = await prisma.event.findUnique({ where: { slug }, select: { id: true } });
    if (!hit || hit.id === exceptId) return slug;
  }
  return `${base}-${randomUUID().slice(0, 6)}`;
}

export async function createEvent(input: EventInput): Promise<Event> {
  const data = eventData(input);
  for (const k of ['title', 'startsAt', 'endsAt', 'capacity', 'pricePerSeat'] as const) {
    if (data[k] === undefined) throw new EventError(`Missing ${k}.`);
  }
  const slug = await uniqueSlug(data.title as string, data.startsAt as Date);
  return prisma.event.create({
    data: {
      ...(data as Prisma.EventUncheckedCreateInput),
      slug,
      description: (data.description as string) ?? '',
      location: (data.location as string) ?? '',
      status: 'draft',
    },
  });
}

export async function updateEvent(id: string, input: Partial<EventInput>): Promise<Event> {
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) throw new EventError('Event not found.', 404);
  if (existing.status === 'cancelled') throw new EventError('This event is cancelled and can no longer be edited.', 409);
  const data = eventData(input, existing);
  if (data.capacity !== undefined) {
    const taken = (await seatsTakenFor([id])).get(id) ?? 0;
    if ((data.capacity as number) < taken)
      throw new EventError(`${taken} seats are already taken, so capacity can't go below ${taken}.`);
  }
  // Keep the public URL stable once people may have it; only drafts get a new slug.
  if (existing.status === 'draft' && (data.title !== undefined || data.startsAt !== undefined)) {
    data.slug = await uniqueSlug((data.title as string) ?? existing.title, (data.startsAt as Date) ?? existing.startsAt, id);
  }
  return prisma.event.update({ where: { id }, data });
}

// ------------------------------------------------------------ registering

function ageOn(dob: Date, on: Date): number {
  let age = on.getUTCFullYear() - dob.getUTCFullYear();
  const m = on.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && on.getUTCDate() < dob.getUTCDate())) age--;
  return age;
}

export async function register(slug: string, req: RegisterRequest): Promise<EventRegistration> {
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event || event.status === 'draft') throw new EventError('Event not found.', 404);
  if (event.status === 'cancelled') throw new EventError('This event has been cancelled.', 409, 'CLOSED');
  if (Date.now() >= (event.registrationClosesAt ?? event.startsAt).getTime())
    throw new EventError('Registration for this event is closed.', 409, 'CLOSED');

  const name = (req.name ?? '').trim().slice(0, 120);
  const email = (req.email ?? '').trim().toLowerCase().slice(0, 254);
  const phone = (req.phone ?? '').trim().slice(0, 40) || null;
  const seats = Number(req.seats);
  if (!name) throw new EventError('Enter your name.', 400, 'INVALID');
  if (!EMAIL_RE.test(email)) throw new EventError('Enter a valid email address.', 400, 'INVALID');
  if (!Number.isInteger(seats) || seats < 1) throw new EventError('Choose how many seats.', 400, 'INVALID');
  if (seats > event.maxSeatsPerOrder)
    throw new EventError(`You can reserve up to ${event.maxSeatsPerOrder} seats at a time.`, 400, 'INVALID');

  let dateOfBirth: Date | null = null;
  if (event.requires21) {
    const d = new Date(`${req.dateOfBirth ?? ''}T00:00:00Z`);
    if (!req.dateOfBirth || Number.isNaN(d.getTime())) throw new EventError('Enter your date of birth.', 400, 'INVALID');
    if (ageOn(d, event.startsAt) < 21) throw new EventError('This event is for guests 21 and over.', 400, 'UNDER_21');
    dateOfBirth = d;
  }

  if (req.waitlist) {
    if (!event.waitlistEnabled) throw new EventError('This event doesn’t have a waitlist.', 400, 'INVALID');
    return prisma.eventRegistration.create({
      data: { eventId: event.id, name, email, phone, dateOfBirth, seats, amountPaid: 0, status: 'waitlist' },
    });
  }

  const paid = event.pricePerSeat > 0;
  const total = event.pricePerSeat * seats;
  if (paid && !req.sourceId) throw new EventError('Enter your card details.', 400, 'INVALID');

  // 1. Hold the seats (row lock serializes concurrent buyers for this event).
  const hold = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "events" WHERE id = ${event.id} FOR UPDATE`;
    const taken = (await seatsTakenFor([event.id], tx)).get(event.id) ?? 0;
    const left = event.capacity - taken;
    if (left <= 0) throw new EventError('Sorry, this event just sold out.', 409, 'SOLD_OUT', { seatsLeft: 0 });
    if (seats > left)
      throw new EventError(`Only ${left} seat${left === 1 ? '' : 's'} left.`, 409, 'NOT_ENOUGH_SEATS', { seatsLeft: left });
    return tx.eventRegistration.create({
      data: {
        eventId: event.id,
        name,
        email,
        phone,
        dateOfBirth,
        seats,
        amountPaid: 0,
        status: paid ? 'pending' : 'confirmed',
        holdExpiresAt: paid ? new Date(Date.now() + HOLD_MINUTES * 60 * 1000) : null,
      },
    });
  });

  if (!paid) return hold;

  // 2. Create an itemized Square order ("<event> (<date>)" × seats) so event
  //    sales show up in Square's item reports, then charge the card against
  //    it. Both calls are idempotent on the hold id, so a retry can't double
  //    charge.
  let paymentId: string;
  try {
    const { locationId } = getSquarePublicConfig();
    const orderResult = await getSquareClient().orders.create({
      idempotencyKey: `event-order-${hold.id}`,
      order: {
        locationId,
        referenceId: `EV-${hold.id.slice(0, 8).toUpperCase()}`,
        source: { name: 'Olympic Bluffs Website' },
        lineItems: [
          {
            name: `${event.title} (${pacificDate(event.startsAt)})`,
            quantity: String(seats),
            basePriceMoney: { amount: BigInt(event.pricePerSeat), currency: 'USD' },
            note: `Event registration: ${name}`,
          },
        ],
      },
    });
    const squareOrderId = orderResult.order?.id;
    if (!squareOrderId) throw new Error('Square did not create the order.');
    const payment = await chargeCard({
      sourceId: req.sourceId!,
      amountCents: total,
      buyerEmail: email,
      squareOrderId,
      note: `${event.title} (${pacificDate(event.startsAt)}), ${seats} seat${seats === 1 ? '' : 's'}`,
      idempotencyKey: hold.id,
    });
    paymentId = payment.paymentId;
  } catch (error) {
    await prisma.eventRegistration.delete({ where: { id: hold.id } }).catch(() => {});
    const decline = describeDecline(error);
    console.error('Event payment failed:', error);
    throw new EventError(decline ?? 'We couldn’t process that card. Please try again.', 402, 'DECLINED');
  }

  // 3. Confirm.
  return prisma.eventRegistration.update({
    where: { id: hold.id },
    data: { status: 'confirmed', paymentId, amountPaid: total, holdExpiresAt: null },
  });
}

// ------------------------------------------------- refunds and cancelling

export async function refundRegistration(reg: EventRegistration, reason: string): Promise<EventRegistration> {
  if (reg.status !== 'confirmed') throw new EventError('Only confirmed registrations can be refunded.', 409);
  if (!reg.paymentId || reg.amountPaid <= 0) throw new EventError('Nothing was paid for this registration.', 409);
  const res = await getSquareClient().refunds.refundPayment({
    idempotencyKey: `refund-${reg.id}`,
    paymentId: reg.paymentId,
    amountMoney: { amount: BigInt(reg.amountPaid), currency: 'USD' },
    reason: reason.slice(0, 192),
  });
  const refundId = res.refund?.id ?? null;
  if (!refundId) throw new EventError('Square didn’t accept the refund.', 502);
  return prisma.eventRegistration.update({
    where: { id: reg.id },
    data: { status: 'refunded', refundId, cancelledAt: new Date() },
  });
}

export async function cancelRegistration(reg: EventRegistration): Promise<EventRegistration> {
  if (reg.status === 'cancelled' || reg.status === 'refunded') return reg;
  return prisma.eventRegistration.update({ where: { id: reg.id }, data: { status: 'cancelled', cancelledAt: new Date() } });
}

/** Clears pending holds whose payment never completed. */
export async function releaseExpiredHolds(): Promise<number> {
  const r = await prisma.eventRegistration.deleteMany({ where: { status: 'pending', holdExpiresAt: { lt: new Date() } } });
  return r.count;
}
