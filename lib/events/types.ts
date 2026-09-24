/**
 * Shapes shared by the events API (app/api/events/*, app/api/admin/events/*)
 * and the pages (app/events/*, app/admin/events/*). Dates are ISO strings;
 * money is in cents.
 */

export type EventStatus = 'draft' | 'published' | 'cancelled';

/** confirmed = paid (or free) and holding seats; pending = seats held while the card is charged. */
export type RegistrationStatus = 'pending' | 'confirmed' | 'waitlist' | 'cancelled' | 'refunded';

export interface EventInput {
  title: string;
  /** Plain text; blank lines separate paragraphs. */
  description: string;
  /** Path under /images/… or an https URL */
  image: string | null;
  imageAlt: string | null;
  startsAt: string;
  endsAt: string;
  /** Where on the farm to meet */
  location: string;
  capacity: number;
  /** 0 = free (RSVP only, no card) */
  pricePerSeat: number;
  maxSeatsPerOrder: number;
  requires21: boolean;
  waitlistEnabled: boolean;
  /** null = registration closes when the event starts */
  registrationClosesAt: string | null;
  refundPolicy: string | null;
}

export interface AdminEventDTO extends EventInput {
  id: string;
  slug: string;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  /** Seats held by confirmed + unexpired pending registrations */
  seatsTaken: number;
  seatsLeft: number;
  confirmedCount: number;
  waitlistCount: number;
  /** Sum of amountPaid for confirmed registrations */
  revenueCents: number;
}

export interface RegistrationDTO {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  seats: number;
  amountPaid: number;
  paymentId: string | null;
  refundId: string | null;
  status: RegistrationStatus;
  checkedInAt: string | null;
  adminNotes: string | null;
  createdAt: string;
}

/** Public view of an event (no roster). */
export interface PublicEventDTO {
  slug: string;
  title: string;
  description: string;
  image: string | null;
  imageAlt: string | null;
  startsAt: string;
  endsAt: string;
  location: string;
  pricePerSeat: number;
  maxSeatsPerOrder: number;
  requires21: boolean;
  waitlistEnabled: boolean;
  refundPolicy: string | null;
  seatsLeft: number;
  capacity: number;
  /** open | sold_out | closed (past the close time or started) | cancelled */
  registration: 'open' | 'sold_out' | 'closed' | 'cancelled';
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone?: string;
  seats: number;
  /** YYYY-MM-DD, required when the event is 21+ */
  dateOfBirth?: string;
  /** Square card token; required when pricePerSeat > 0 and not joining the waitlist */
  sourceId?: string;
  /** Join the waitlist instead of buying (only when sold out and waitlist is enabled) */
  waitlist?: boolean;
}

export interface RegisterResponse {
  registration: { id: string; status: RegistrationStatus; seats: number; amountPaid: number };
}

/** Error body for register: { error: string, code?: 'SOLD_OUT' | 'NOT_ENOUGH_SEATS' | 'CLOSED' | 'DECLINED' | 'UNDER_21' | 'INVALID' } */
export type RegisterErrorCode = 'SOLD_OUT' | 'NOT_ENOUGH_SEATS' | 'CLOSED' | 'DECLINED' | 'UNDER_21' | 'INVALID';
