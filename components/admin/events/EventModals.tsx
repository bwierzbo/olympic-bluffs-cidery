'use client';

import { useState } from 'react';
import type { AdminEventDTO } from '@/lib/events/types';
import {
  apiFetch,
  dangerButton,
  helpClass,
  inputClass,
  labelClass,
  Modal,
  primaryButton,
  secondaryButton,
  useApiError,
} from '@/app/admin/events/_shared';

export interface CancelResult {
  event: AdminEventDTO;
  refunded: number;
  failed: number;
}

export function CancelEventModal({
  event,
  onClose,
  onCancelled,
}: {
  event: AdminEventDTO;
  onClose: () => void;
  onCancelled: (result: CancelResult) => void;
}) {
  const handleError = useApiError();
  const isPaid = event.pricePerSeat > 0 || event.revenueCents > 0;
  const [refund, setRefund] = useState(isPaid);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const people = event.confirmedCount;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await apiFetch<CancelResult>(`/api/admin/events/${event.id}/cancel`, {
        method: 'POST',
        body: { refund: isPaid && refund, message: message.trim() || undefined },
      });
      onCancelled(result);
    } catch (err) {
      setError(handleError(err));
      setBusy(false);
    }
  };

  return (
    <Modal titleId="cancel-event-title" title="Cancel this event?" busy={busy} onClose={onClose}>
      <div className="space-y-4 text-sm text-gray-700">
        <p>
          The event comes off the site and registration closes.{' '}
          {people > 0 ? (
            <>
              Everyone with a confirmed registration ({people} {people === 1 ? 'person' : 'people'}) gets an email
              saying it&apos;s cancelled.
            </>
          ) : (
            <>Nobody has registered yet, so no emails go out.</>
          )}{' '}
          This can&apos;t be undone.
        </p>

        {isPaid && (
          <div className="flex items-start gap-3">
            <input
              id="cancel-refund"
              type="checkbox"
              checked={refund}
              onChange={(e) => setRefund(e.target.checked)}
              disabled={busy}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-sage-600 focus:ring-sage-500"
              aria-describedby="cancel-refund-help"
            />
            <div>
              <label htmlFor="cancel-refund" className="font-medium text-gray-900">
                Refund everyone who paid
              </label>
              <p id="cancel-refund-help" className="text-xs text-gray-500">
                Full refunds go back to their cards through Square.
              </p>
            </div>
          </div>
        )}

        {people > 0 && (
          <div>
            <label htmlFor="cancel-message" className={labelClass}>
              Message <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <textarea
              id="cancel-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={busy}
              rows={4}
              className={inputClass}
              placeholder="We're so sorry — the orchard flooded. We'll let you know when we reschedule."
            />
            <p className={helpClass}>Added to the cancellation email.</p>
          </div>
        )}

        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} disabled={busy} className={secondaryButton}>
            Keep the event
          </button>
          <button type="button" onClick={submit} disabled={busy} className={dangerButton}>
            {busy
              ? 'Cancelling...'
              : people > 0
                ? `Cancel event and email ${people} ${people === 1 ? 'person' : 'people'}`
                : 'Cancel event'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export type Audience = 'confirmed' | 'waitlist' | 'all';

export interface EmailDraft {
  audience: Audience;
  subject: string;
  body: string;
}

export function EmailAttendeesModal({
  event,
  initial,
  counts,
  onClose,
}: {
  event: AdminEventDTO;
  initial: EmailDraft;
  counts: Record<Audience, number>;
  onClose: () => void;
}) {
  const handleError = useApiError();
  const [draft, setDraft] = useState<EmailDraft>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<number | null>(null);

  const recipients = counts[draft.audience];
  const canSend = draft.subject.trim() !== '' && draft.body.trim() !== '' && recipients > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setBusy(true);
    setError(null);
    try {
      const result = await apiFetch<{ sent: number }>(`/api/admin/events/${event.id}/message`, {
        method: 'POST',
        body: { subject: draft.subject.trim(), body: draft.body.trim(), audience: draft.audience },
      });
      setSent(result.sent);
    } catch (err) {
      setError(handleError(err));
    } finally {
      setBusy(false);
    }
  };

  if (sent !== null) {
    return (
      <Modal titleId="email-attendees-title" title="Email sent" busy={false} onClose={onClose}>
        <p className="text-sm text-gray-700 mb-4">
          Sent to {sent} {sent === 1 ? 'person' : 'people'}.
        </p>
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className={primaryButton} autoFocus>
            Done
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal titleId="email-attendees-title" title="Email attendees" busy={busy} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="email-audience" className={labelClass}>
            Send to
          </label>
          <select
            id="email-audience"
            value={draft.audience}
            onChange={(e) => setDraft({ ...draft, audience: e.target.value as Audience })}
            disabled={busy}
            className={inputClass}
          >
            <option value="confirmed">Confirmed attendees ({counts.confirmed})</option>
            <option value="waitlist">Waitlist ({counts.waitlist})</option>
            <option value="all">Everyone ({counts.all})</option>
          </select>
        </div>
        <div>
          <label htmlFor="email-subject" className={labelClass}>
            Subject
          </label>
          <input
            id="email-subject"
            type="text"
            value={draft.subject}
            onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
            disabled={busy}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="email-body" className={labelClass}>
            Message
          </label>
          <textarea
            id="email-body"
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            disabled={busy}
            rows={8}
            className={inputClass}
          />
          <p className={helpClass}>Plain text. Leave a blank line between paragraphs.</p>
        </div>
        {recipients === 0 && <p className="text-sm text-amber-800">Nobody in this group to email yet.</p>}
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className={secondaryButton}>
            Cancel
          </button>
          <button type="submit" disabled={busy || !canSend} className={primaryButton}>
            {busy ? 'Sending...' : `Send to ${recipients} ${recipients === 1 ? 'person' : 'people'}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
