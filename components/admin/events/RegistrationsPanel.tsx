'use client';

import { useState } from 'react';
import type { AdminEventDTO, RegistrationDTO } from '@/lib/events/types';
import {
  apiFetch,
  cardClass,
  dangerButton,
  inputClass,
  labelClass,
  NoticeAlert,
  primaryButton,
  RegistrationStatusBadge,
  secondaryButton,
  formatMoney,
  useApiError,
} from '@/app/admin/events/_shared';
import { EmailAttendeesModal, type Audience, type EmailDraft } from './EventModals';
import { formatPacificDate, formatPacificTime } from './pacific';

type Filter = 'confirmed' | 'waitlist' | 'closed';

const FILTER_LABELS: Record<Filter, string> = {
  confirmed: 'Confirmed',
  waitlist: 'Waitlist',
  closed: 'Cancelled & refunded',
};

function filterOf(reg: RegistrationDTO): Filter {
  if (reg.status === 'waitlist') return 'waitlist';
  if (reg.status === 'cancelled' || reg.status === 'refunded') return 'closed';
  return 'confirmed';
}

interface RegistrationsPanelProps {
  event: AdminEventDTO;
  registrations: RegistrationDTO[];
  /** Refetch the event and roster after a change. */
  onChanged: () => Promise<void>;
  /** Swap in one updated registration right away, before the refetch lands. */
  onRegistrationUpdated: (registration: RegistrationDTO) => void;
}

export default function RegistrationsPanel({
  event,
  registrations,
  onChanged,
  onRegistrationUpdated,
}: RegistrationsPanelProps) {
  const [filter, setFilter] = useState<Filter>('confirmed');
  const [adding, setAdding] = useState(false);
  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const confirmed = registrations.filter((r) => r.status === 'confirmed');
  const waitlist = registrations.filter((r) => r.status === 'waitlist');
  const seatsConfirmed = confirmed.reduce((sum, r) => sum + r.seats, 0);
  const checkedIn = confirmed.filter((r) => r.checkedInAt !== null);
  const seatsCheckedIn = checkedIn.reduce((sum, r) => sum + r.seats, 0);
  const counts: Record<Filter, number> = { confirmed: 0, waitlist: 0, closed: 0 };
  for (const r of registrations) counts[filterOf(r)] += 1;
  const shown = registrations.filter((r) => filterOf(r) === filter);
  const isFree = event.pricePerSeat === 0;

  const audienceCounts: Record<Audience, number> = {
    confirmed: confirmed.length,
    waitlist: waitlist.length,
    all: confirmed.length + waitlist.length,
  };

  const openEmail = () =>
    setEmailDraft({ audience: 'confirmed', subject: `About ${event.title}`, body: '' });

  const openSpotOpened = () =>
    setEmailDraft({
      audience: 'waitlist',
      subject: `A spot opened up: ${event.title}`,
      body: `Good news: a spot just opened up for ${event.title} on ${formatPacificDate(event.startsAt)} at ${formatPacificTime(event.startsAt)}.\n\nSeats go to whoever registers first. Grab yours here:\n${window.location.origin}/events/${event.slug}\n\nSee you at the farm!`,
    });

  return (
    <div>
      <dl className="grid grid-cols-3 gap-3 mb-4">
        <div className={`${cardClass} px-4 py-3`}>
          <dt className="text-xs text-gray-500 uppercase tracking-wide">Seats confirmed</dt>
          <dd className="text-xl font-semibold text-gray-900">
            {seatsConfirmed}
            <span className="text-sm font-normal text-gray-500"> / {event.capacity}</span>
          </dd>
        </div>
        <div className={`${cardClass} px-4 py-3`}>
          <dt className="text-xs text-gray-500 uppercase tracking-wide">Checked in</dt>
          <dd className="text-xl font-semibold text-gray-900">
            {seatsCheckedIn}
            <span className="text-sm font-normal text-gray-500"> of {seatsConfirmed}</span>
          </dd>
        </div>
        <div className={`${cardClass} px-4 py-3`}>
          <dt className="text-xs text-gray-500 uppercase tracking-wide">Revenue</dt>
          <dd className="text-xl font-semibold text-gray-900">{isFree ? 'Free' : formatMoney(event.revenueCents)}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          aria-expanded={adding}
          className={secondaryButton}
        >
          Add attendee
        </button>
        <a href={`/api/admin/events/${event.id}/export`} download className={secondaryButton}>
          Export CSV
        </a>
        <button
          type="button"
          onClick={openEmail}
          disabled={audienceCounts.all === 0}
          className={secondaryButton}
        >
          Email attendees
        </button>
      </div>

      {notice && <NoticeAlert onDismiss={() => setNotice(null)}>{notice}</NoticeAlert>}

      {adding && (
        <AddAttendeeForm
          event={event}
          onClose={() => setAdding(false)}
          onAdded={async (reg) => {
            setAdding(false);
            setFilter('confirmed');
            setNotice(`Added ${reg.name} (${reg.seats} ${reg.seats === 1 ? 'seat' : 'seats'}).`);
            await onChanged();
          }}
        />
      )}

      <div role="group" aria-label="Show registrations" className="flex flex-wrap gap-2 mb-3">
        {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 ${
              filter === f
                ? 'bg-sage-600 border-sage-600 text-white'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {FILTER_LABELS[f]} <span className={filter === f ? 'text-sage-100' : 'text-gray-400'}>({counts[f]})</span>
          </button>
        ))}
      </div>

      {filter === 'waitlist' && waitlist.length > 0 && !isFree && event.seatsLeft > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-md mb-3 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span>
            {event.seatsLeft} {event.seatsLeft === 1 ? 'seat is' : 'seats are'} open. Paid seats can&apos;t be
            confirmed from here; let the waitlist know so they can book.
          </span>
          <button type="button" onClick={openSpotOpened} className={secondaryButton}>
            Email a spot opened
          </button>
        </div>
      )}

      <div className={`${cardClass} overflow-hidden`}>
        <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_3.5rem_5.5rem_6.5rem_9rem_5.5rem] gap-4 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
          <span>Name</span>
          <span>Seats</span>
          <span>Paid</span>
          <span>Status</span>
          <span>Check-in</span>
          <span className="sr-only">Actions</span>
        </div>
        {shown.length === 0 ? (
          <p className="px-4 py-8 text-sm text-gray-500 text-center">
            {filter === 'confirmed' && 'No confirmed registrations yet.'}
            {filter === 'waitlist' && 'Nobody on the waitlist.'}
            {filter === 'closed' && 'No cancelled or refunded registrations.'}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {shown.map((reg) => (
              <RegistrationRow
                key={reg.id}
                event={event}
                registration={reg}
                onUpdated={async (updated, message) => {
                  onRegistrationUpdated(updated);
                  if (message) setNotice(message);
                  await onChanged();
                }}
                onEmailSpotOpened={openSpotOpened}
              />
            ))}
          </ul>
        )}
      </div>

      {emailDraft && (
        <EmailAttendeesModal
          event={event}
          initial={emailDraft}
          counts={audienceCounts}
          onClose={() => setEmailDraft(null)}
        />
      )}
    </div>
  );
}

function paidLabel(reg: RegistrationDTO, event: AdminEventDTO): string {
  if (reg.amountPaid > 0) return formatMoney(reg.amountPaid);
  if (event.pricePerSeat === 0) return 'Free';
  if (reg.status === 'waitlist' || reg.status === 'pending') return '—';
  return 'Comp';
}

type RowAction = 'check_in' | 'undo_check_in' | 'cancel' | 'refund' | 'confirm_waitlist' | 'note';

function RegistrationRow({
  event,
  registration: reg,
  onUpdated,
  onEmailSpotOpened,
}: {
  event: AdminEventDTO;
  registration: RegistrationDTO;
  onUpdated: (registration: RegistrationDTO, message?: string) => Promise<void>;
  onEmailSpotOpened: () => void;
}) {
  const handleError = useApiError();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirming, setConfirming] = useState<'refund' | 'cancel' | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(reg.adminNotes ?? '');
  const [busy, setBusy] = useState<RowAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const firstName = reg.name.split(' ')[0] || reg.name;
  const canRefund = reg.status === 'confirmed' && reg.amountPaid > 0 && reg.refundId === null;
  const canCancel = reg.status === 'confirmed' || reg.status === 'waitlist';
  const canConfirmWaitlist = reg.status === 'waitlist' && event.pricePerSeat === 0;
  const canEmailSpot = reg.status === 'waitlist' && event.pricePerSeat > 0;
  const cancelLabel =
    reg.status === 'waitlist'
      ? 'Remove from waitlist'
      : reg.amountPaid > 0
        ? 'Cancel without refund'
        : 'Cancel registration';

  const act = async (action: RowAction, successMessage?: string) => {
    setBusy(action);
    setError(null);
    try {
      const { registration } = await apiFetch<{ registration: RegistrationDTO }>(
        `/api/admin/events/${event.id}/registrations/${reg.id}`,
        { method: 'PATCH', body: action === 'note' ? { action, note: note.trim() } : { action } }
      );
      setConfirming(null);
      if (action === 'note') setNoteOpen(false);
      if (action !== 'check_in' && action !== 'undo_check_in' && action !== 'note') setMenuOpen(false);
      await onUpdated(registration, successMessage);
    } catch (err) {
      setError(handleError(err));
    } finally {
      setBusy(null);
    }
  };

  const checkedIn = reg.checkedInAt !== null;

  return (
    <li className={`px-4 py-3 ${checkedIn ? 'bg-green-50/40' : ''}`}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_3.5rem_5.5rem_6.5rem_9rem_5.5rem] gap-x-4 gap-y-2 items-center">
        <div className="min-w-0">
          <p className="font-medium text-gray-900 break-words">{reg.name}</p>
          <p className="text-xs text-gray-500 break-all">
            <a href={`mailto:${reg.email}`} className="hover:underline">
              {reg.email}
            </a>
            {reg.phone && (
              <>
                {' · '}
                <a href={`tel:${reg.phone}`} className="hover:underline">
                  {reg.phone}
                </a>
              </>
            )}
          </p>
          {reg.adminNotes && !noteOpen && (
            <p className="mt-1 text-xs text-gray-700 bg-yellow-50 border border-yellow-100 rounded px-2 py-1 whitespace-pre-wrap">
              {reg.adminNotes}
            </p>
          )}
        </div>

        {/* Mobile: status in the top-right corner */}
        <div className="sm:hidden justify-self-end">
          <RegistrationStatusBadge status={reg.status} />
        </div>

        <div className="hidden sm:block text-sm text-gray-900">{reg.seats}</div>
        <div className="hidden sm:block text-sm text-gray-700">{paidLabel(reg, event)}</div>
        <div className="hidden sm:block">
          <RegistrationStatusBadge status={reg.status} />
        </div>

        <p className="sm:hidden col-span-2 text-sm text-gray-600">
          {reg.seats} {reg.seats === 1 ? 'seat' : 'seats'} · {paidLabel(reg, event)}
        </p>

        <div>
          {reg.status === 'confirmed' ? (
            <button
              type="button"
              onClick={() => act(checkedIn ? 'undo_check_in' : 'check_in')}
              disabled={busy !== null}
              aria-pressed={checkedIn}
              className={`w-full min-h-11 px-3 py-2 rounded-md text-sm font-semibold border transition-colors disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 ${
                checkedIn
                  ? 'bg-green-600 border-green-600 text-white hover:bg-green-700'
                  : 'bg-white border-sage-600 text-sage-700 hover:bg-sage-50'
              }`}
            >
              {busy === 'check_in' || busy === 'undo_check_in'
                ? 'Saving...'
                : checkedIn
                  ? `✓ Checked in`
                  : 'Check in'}
            </button>
          ) : (
            <span className="hidden sm:inline text-sm text-gray-400">—</span>
          )}
        </div>

        <div className="justify-self-end">
          <button
            type="button"
            onClick={() => {
              setMenuOpen((v) => !v);
              setConfirming(null);
              setError(null);
            }}
            aria-expanded={menuOpen}
            aria-controls={`reg-actions-${reg.id}`}
            className={`${secondaryButton} min-h-11 sm:min-h-0`}
          >
            {menuOpen ? 'Close' : 'More'}
          </button>
        </div>
      </div>

      {checkedIn && reg.checkedInAt && (
        <p className="mt-1 text-xs text-green-800">Checked in at {formatPacificTime(reg.checkedInAt)}</p>
      )}

      {error && !menuOpen && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {menuOpen && (
        <div id={`reg-actions-${reg.id}`} className="mt-3 rounded-md bg-gray-50 border border-gray-200 p-3 space-y-3">
          {confirming === 'refund' ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <p className="text-sm text-gray-900 flex-1">
                Refund {formatMoney(reg.amountPaid)} to {firstName}? Their registration is cancelled and they get an
                email.
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setConfirming(null)} disabled={busy !== null} className={secondaryButton}>
                  Keep
                </button>
                <button
                  type="button"
                  onClick={() => act('refund', `Refunded ${formatMoney(reg.amountPaid)} to ${reg.name}.`)}
                  disabled={busy !== null}
                  className={dangerButton}
                >
                  {busy === 'refund' ? 'Refunding...' : 'Yes, refund'}
                </button>
              </div>
            </div>
          ) : confirming === 'cancel' ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <p className="text-sm text-gray-900 flex-1">
                {reg.status === 'waitlist'
                  ? `Take ${firstName} off the waitlist?`
                  : reg.amountPaid > 0
                    ? `Cancel ${firstName}'s registration without refunding the ${formatMoney(reg.amountPaid)}?`
                    : `Cancel ${firstName}'s registration? Their ${reg.seats === 1 ? 'seat opens' : 'seats open'} up.`}
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setConfirming(null)} disabled={busy !== null} className={secondaryButton}>
                  Keep
                </button>
                <button
                  type="button"
                  onClick={() => act('cancel', `Cancelled ${reg.name}'s registration.`)}
                  disabled={busy !== null}
                  className={dangerButton}
                >
                  {busy === 'cancel' ? 'Cancelling...' : 'Yes, cancel'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {canConfirmWaitlist && (
                <button
                  type="button"
                  onClick={() => act('confirm_waitlist', `Confirmed ${reg.name}.`)}
                  disabled={busy !== null}
                  className={primaryButton}
                >
                  {busy === 'confirm_waitlist' ? 'Confirming...' : 'Confirm seat'}
                </button>
              )}
              {canEmailSpot && (
                <button type="button" onClick={onEmailSpotOpened} className={secondaryButton}>
                  Email the waitlist a spot opened
                </button>
              )}
              {canRefund && (
                <button type="button" onClick={() => setConfirming('refund')} className={secondaryButton}>
                  Refund {formatMoney(reg.amountPaid)}
                </button>
              )}
              {canCancel && (
                <button type="button" onClick={() => setConfirming('cancel')} className={secondaryButton}>
                  {cancelLabel}
                </button>
              )}
              {!noteOpen && (
                <button
                  type="button"
                  onClick={() => {
                    setNote(reg.adminNotes ?? '');
                    setNoteOpen(true);
                  }}
                  className={secondaryButton}
                >
                  {reg.adminNotes ? 'Edit note' : 'Add note'}
                </button>
              )}
            </div>
          )}

          {noteOpen && confirming === null && (
            <div>
              <label htmlFor={`reg-note-${reg.id}`} className={labelClass}>
                Note <span className="font-normal text-gray-500">(only you see this)</span>
              </label>
              <textarea
                id={`reg-note-${reg.id}`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className={inputClass}
                placeholder="Paid cash at the door, allergic to nuts..."
              />
              <div className="mt-2 flex gap-2 justify-end">
                <button type="button" onClick={() => setNoteOpen(false)} disabled={busy !== null} className={secondaryButton}>
                  Cancel
                </button>
                <button type="button" onClick={() => act('note')} disabled={busy !== null} className={primaryButton}>
                  {busy === 'note' ? 'Saving...' : 'Save note'}
                </button>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500">Registered {formatPacificDate(reg.createdAt)}</p>

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function AddAttendeeForm({
  event,
  onClose,
  onAdded,
}: {
  event: AdminEventDTO;
  onClose: () => void;
  onAdded: (registration: RegistrationDTO) => Promise<void>;
}) {
  const handleError = useApiError();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [seats, setSeats] = useState('1');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const seatCount = /^\d+$/.test(seats.trim()) ? Number(seats.trim()) : 0;
    if (!name.trim()) return setError('Enter their name.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address.');
    if (seatCount < 1) return setError('Seats needs to be at least 1.');
    setBusy(true);
    setError(null);
    try {
      const { registration } = await apiFetch<{ registration: RegistrationDTO }>(
        `/api/admin/events/${event.id}/registrations`,
        {
          method: 'POST',
          body: {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim() || undefined,
            seats: seatCount,
            note: note.trim() || undefined,
          },
        }
      );
      await onAdded(registration);
    } catch (err) {
      setError(handleError(err));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className={`${cardClass} p-4 mb-4`}>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">Add an attendee</h3>
      <p className="text-xs text-gray-500 mb-3">
        For comps or people who paid in person. They&apos;re confirmed right away with nothing charged.
      </p>
      <fieldset disabled={busy} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 min-w-0">
        <div>
          <label htmlFor="add-name" className={labelClass}>
            Name
          </label>
          <input id="add-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="add-email" className={labelClass}>
            Email
          </label>
          <input id="add-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="add-phone" className={labelClass}>
            Phone <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <input id="add-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="add-seats" className={labelClass}>
            Seats
          </label>
          <input
            id="add-seats"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={seats}
            onChange={(e) => setSeats(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <label htmlFor="add-note" className={labelClass}>
            Note <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <input
            id="add-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
            placeholder="Comp for the Saturday volunteers"
          />
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onClose} disabled={busy} className={secondaryButton}>
          Cancel
        </button>
        <button type="submit" disabled={busy} className={primaryButton}>
          {busy ? 'Adding...' : 'Add attendee'}
        </button>
      </div>
    </form>
  );
}
