'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type {
  PublicEventDTO,
  RegisterErrorCode,
  RegisterRequest,
  RegisterResponse,
} from '@/lib/events/types';
import SquareCardField, { type SquareCardFieldHandle } from './SquareCardField';
import { formatDollars, formatTotal } from './format';

type Registration = RegisterResponse['registration'];
type RegisterError = { error?: string; code?: RegisterErrorCode };

const INPUT =
  'mt-1.5 block min-h-11 w-full border border-line bg-paper px-3 text-[15px] text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none disabled:opacity-60';
const LABEL = 'block text-[13px] font-semibold text-ink';
const ERROR_TEXT = 'text-[13.5px] text-[#9b3b25]';
const GENERIC_ERROR = 'Something went wrong. Please try again in a minute.';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function seatWord(n: number): string {
  return n === 1 ? 'seat' : 'seats';
}

function range(n: number): number[] {
  return Array.from({ length: Math.max(0, n) }, (_, i) => i + 1);
}

/** YYYY-MM-DD of the event's start in farm time. */
function eventDay(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date(iso));
}

/** True when someone born on `dob` (YYYY-MM-DD) is 21 by `day` (YYYY-MM-DD). */
function isTwentyOneBy(dob: string, day: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!m) return false;
  return `${Number(m[1]) + 21}-${m[2]}-${m[3]}` <= day;
}

async function postRegistration(
  slug: string,
  body: RegisterRequest
): Promise<{ ok: true; registration: Registration } | { ok: false; error: string; code?: RegisterErrorCode }> {
  try {
    const res = await fetch(`/api/events/${encodeURIComponent(slug)}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Partial<RegisterResponse> & RegisterError;
    if (res.ok && data.registration) return { ok: true, registration: data.registration };
    return { ok: false, error: data.error || GENERIC_ERROR, code: data.code };
  } catch {
    return { ok: false, error: 'We couldn’t reach the farm’s server. Check your connection and try again.' };
  }
}

async function fetchEvent(slug: string): Promise<PublicEventDTO | null> {
  try {
    const res = await fetch(`/api/events/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as PublicEventDTO | { event: PublicEventDTO };
    return 'event' in data ? data.event : data;
  } catch {
    return null;
  }
}

/**
 * The registration card on an event page. Shows the form while seats are
 * open, a waitlist form when sold out (if the event allows it), and a
 * confirmation once registered. Paid events tokenize the card with Square
 * before posting; the server charges it.
 */
export default function EventRegistration({ event: initial }: { event: PublicEventDTO }) {
  const [event, setEvent] = useState(initial);
  const [done, setDone] = useState<{ registration: Registration; waitlist: boolean } | null>(null);
  const [notice, setNotice] = useState('');

  if (done) return <Success event={event} registration={done.registration} waitlist={done.waitlist} />;

  switch (event.registration) {
    case 'open':
      return (
        <RegisterForm
          event={event}
          onEventChange={setEvent}
          onDone={(registration) => setDone({ registration, waitlist: registration.status === 'waitlist' })}
          onStateChange={(registration, message) => {
            setNotice(message);
            setEvent((e) => ({ ...e, registration, seatsLeft: registration === 'sold_out' ? 0 : e.seatsLeft }));
          }}
        />
      );
    case 'sold_out':
      return (
        <div>
          <StateHeading>Sold out.</StateHeading>
          {notice && (
            <p role="alert" className={`mt-2 ${ERROR_TEXT}`}>
              {notice}
            </p>
          )}
          {event.waitlistEnabled ? (
            <WaitlistForm event={event} onDone={(registration) => setDone({ registration, waitlist: true })} />
          ) : (
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">
              Every seat is taken. Keep an eye on our events page for the next one.
            </p>
          )}
        </div>
      );
    case 'closed':
      return (
        <div>
          <StateHeading>Registration is closed.</StateHeading>
          {notice && (
            <p role="alert" className={`mt-2 ${ERROR_TEXT}`}>
              {notice}
            </p>
          )}
        </div>
      );
    case 'cancelled':
      return <StateHeading>This event has been cancelled.</StateHeading>;
  }
}

function StateHeading({ children }: { children: React.ReactNode }) {
  return <p className="font-serif text-[24px] leading-tight">{children}</p>;
}

function RegisterForm({
  event,
  onEventChange,
  onDone,
  onStateChange,
}: {
  event: PublicEventDTO;
  onEventChange: (event: PublicEventDTO) => void;
  onDone: (registration: Registration) => void;
  onStateChange: (registration: 'sold_out' | 'closed', message: string) => void;
}) {
  const id = useId();
  const cardRef = useRef<SquareCardFieldHandle>(null);
  const busy = useRef(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [seats, setSeats] = useState(1);
  const [dob, setDob] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [cardError, setCardError] = useState('');

  const maxSeats = Math.max(1, Math.min(event.maxSeatsPerOrder, event.seatsLeft));
  const chosen = Math.min(seats, maxSeats);
  const paid = event.pricePerSeat > 0;
  const total = chosen * event.pricePerSeat;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy.current) return;
    setError('');
    setCardError('');

    if (!name.trim()) return setError('Please enter your name.');
    if (!EMAIL_RE.test(email.trim())) return setError('Please enter a valid email address.');
    if (event.requires21) {
      if (!dob) return setError('Please enter your date of birth.');
      if (!isTwentyOneBy(dob, eventDay(event.startsAt))) {
        return setError('This event is 21 and over. You need to be 21 by the day of the event.');
      }
    }

    busy.current = true;
    setWorking(true);
    try {
      let sourceId: string | undefined;
      if (paid) {
        try {
          sourceId = await cardRef.current?.tokenize();
        } catch (err) {
          setCardError(err instanceof Error ? err.message : 'Check your card details and try again.');
          return;
        }
        if (!sourceId) {
          setCardError('The card form is still loading. Try again in a moment.');
          return;
        }
      }

      const result = await postRegistration(event.slug, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        seats: chosen,
        dateOfBirth: event.requires21 ? dob : undefined,
        sourceId,
      });

      if (result.ok) {
        onDone(result.registration);
        return;
      }

      switch (result.code) {
        case 'SOLD_OUT':
          onStateChange('sold_out', result.error);
          return;
        case 'CLOSED':
          onStateChange('closed', result.error);
          return;
        case 'NOT_ENOUGH_SEATS': {
          const fresh = await fetchEvent(event.slug);
          if (fresh) {
            onEventChange(fresh);
            if (fresh.registration === 'open') setSeats((s) => Math.min(s, Math.max(1, Math.min(fresh.maxSeatsPerOrder, fresh.seatsLeft))));
          }
          setError(result.error);
          return;
        }
        case 'DECLINED':
          // Card field stays mounted; they can edit it or enter another card.
          setCardError(result.error);
          return;
        default:
          setError(result.error);
      }
    } finally {
      busy.current = false;
      setWorking(false);
    }
  }

  const buttonLabel = working
    ? paid
      ? 'Processing…'
      : 'Reserving…'
    : paid
      ? `Pay ${formatTotal(total)} and reserve`
      : `Reserve ${chosen} ${seatWord(chosen)}`;

  return (
    <form onSubmit={submit} noValidate aria-busy={working} className="flex flex-col gap-4">
      <div>
        <p className="font-serif text-[24px] leading-tight">Reserve your seats</p>
        <p className="mt-1 text-[13px] text-ink-3">
          {event.seatsLeft} {seatWord(event.seatsLeft)} left
        </p>
      </div>

      <div>
        <label htmlFor={`${id}-name`} className={LABEL}>
          Name
        </label>
        <input
          id={`${id}-name`}
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={working}
          className={INPUT}
        />
      </div>

      <div>
        <label htmlFor={`${id}-email`} className={LABEL}>
          Email
        </label>
        <input
          id={`${id}-email`}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={working}
          className={INPUT}
        />
      </div>

      <div>
        <label htmlFor={`${id}-phone`} className={LABEL}>
          Phone <span className="font-normal text-ink-3">(optional)</span>
        </label>
        <input
          id={`${id}-phone`}
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={working}
          className={INPUT}
        />
      </div>

      <div>
        <label htmlFor={`${id}-seats`} className={LABEL}>
          Seats
        </label>
        <select
          id={`${id}-seats`}
          value={chosen}
          onChange={(e) => setSeats(Number(e.target.value))}
          disabled={working}
          className={INPUT}
        >
          {range(maxSeats).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {event.requires21 && (
        <div>
          <label htmlFor={`${id}-dob`} className={LABEL}>
            Date of birth
          </label>
          <input
            id={`${id}-dob`}
            type="date"
            autoComplete="bday"
            required
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            disabled={working}
            aria-describedby={`${id}-dob-help`}
            className={INPUT}
          />
          <p id={`${id}-dob-help`} className="mt-1.5 text-[12.5px] text-ink-3">
            You must be 21 or older; we’ll check ID at the door.
          </p>
        </div>
      )}

      {paid && (
        <div>
          <p className={LABEL}>Card</p>
          <div className="mt-1.5">
            <SquareCardField ref={cardRef} disabled={working} />
          </div>
          {cardError && (
            <p role="alert" className={`mt-2 ${ERROR_TEXT}`}>
              {cardError}
            </p>
          )}
        </div>
      )}

      <p className="border-t border-line pt-4 text-[15px]">
        {paid ? (
          <>
            {chosen} {seatWord(chosen)} × {formatDollars(event.pricePerSeat)} ={' '}
            <span className="font-semibold tabular-nums">{formatTotal(total)}</span>
          </>
        ) : (
          <>Free — just reserve your {seatWord(chosen)}</>
        )}
      </p>

      {error && (
        <p role="alert" className={ERROR_TEXT}>
          {error}
        </p>
      )}

      <div>
        <button type="submit" disabled={working} className="btn btn-primary min-h-11 w-full">
          {buttonLabel}
        </button>
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-3">
          You’ll get a confirmation email with a calendar invite.
        </p>
        {event.refundPolicy && (
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-3">{event.refundPolicy}</p>
        )}
      </div>
    </form>
  );
}

function WaitlistForm({ event, onDone }: { event: PublicEventDTO; onDone: (registration: Registration) => void }) {
  const id = useId();
  const busy = useRef(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [seats, setSeats] = useState(1);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy.current) return;
    setError('');
    if (!name.trim()) return setError('Please enter your name.');
    if (!EMAIL_RE.test(email.trim())) return setError('Please enter a valid email address.');

    busy.current = true;
    setWorking(true);
    try {
      const result = await postRegistration(event.slug, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        seats,
        waitlist: true,
      });
      if (result.ok) onDone(result.registration);
      else setError(result.error);
    } finally {
      busy.current = false;
      setWorking(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate aria-busy={working} className="mt-4 flex flex-col gap-4 border-t border-line pt-4">
      <p className="text-[14.5px] leading-relaxed text-ink-2">
        Join the waitlist and we’ll email you if a spot opens.
      </p>
      <div>
        <label htmlFor={`${id}-name`} className={LABEL}>
          Name
        </label>
        <input
          id={`${id}-name`}
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={working}
          className={INPUT}
        />
      </div>
      <div>
        <label htmlFor={`${id}-email`} className={LABEL}>
          Email
        </label>
        <input
          id={`${id}-email`}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={working}
          className={INPUT}
        />
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div>
          <label htmlFor={`${id}-phone`} className={LABEL}>
            Phone <span className="font-normal text-ink-3">(optional)</span>
          </label>
          <input
            id={`${id}-phone`}
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={working}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor={`${id}-seats`} className={LABEL}>
            Seats
          </label>
          <select
            id={`${id}-seats`}
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
            disabled={working}
            className={`${INPUT} w-20`}
          >
            {range(event.maxSeatsPerOrder).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && (
        <p role="alert" className={ERROR_TEXT}>
          {error}
        </p>
      )}
      <button type="submit" disabled={working} className="btn btn-secondary min-h-11 w-full">
        {working ? 'Adding you…' : 'Join the waitlist'}
      </button>
    </form>
  );
}

function Success({
  event,
  registration,
  waitlist,
}: {
  event: PublicEventDTO;
  registration: Registration;
  waitlist: boolean;
}) {
  const headingRef = useRef<HTMLParagraphElement>(null);
  // Move focus to the confirmation so screen readers announce it.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  if (waitlist) {
    return (
      <div role="status">
        <p ref={headingRef} tabIndex={-1} className="font-serif text-[24px] leading-tight focus:outline-none">
          You’re on the waitlist
        </p>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">
          We’ll email you if a spot opens.
        </p>
      </div>
    );
  }

  return (
    <div role="status">
      <p className="eyebrow text-sage">Confirmed</p>
      <p ref={headingRef} tabIndex={-1} className="mt-1 font-serif text-[28px] leading-tight focus:outline-none">
        You’re registered
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-line pt-4 text-[15px]">
        <div>
          <dt className="eyebrow">Seats</dt>
          <dd className="mt-1 tabular-nums">{registration.seats}</dd>
        </div>
        <div>
          <dt className="eyebrow">{registration.amountPaid > 0 ? 'Paid' : 'Price'}</dt>
          <dd className="mt-1 tabular-nums">
            {registration.amountPaid > 0 ? formatTotal(registration.amountPaid) : 'Free'}
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-[14.5px] leading-relaxed text-ink-2">
        Check your email for the confirmation. See you at the farm.
      </p>
      <a href={`/api/events/${encodeURIComponent(event.slug)}/ics`} className="btn btn-secondary mt-5 min-h-11 w-full">
        Add to calendar
      </a>
    </div>
  );
}
