'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import AdminLoginGate from '@/components/admin/AdminLoginGate';
import EventForm from '@/components/admin/events/EventForm';
import { CancelEventModal, type CancelResult } from '@/components/admin/events/EventModals';
import RegistrationsPanel from '@/components/admin/events/RegistrationsPanel';
import { formatEventWhen } from '@/components/admin/events/pacific';
import type { AdminEventDTO, EventInput, RegistrationDTO } from '@/lib/events/types';
import {
  apiFetch,
  cardClass,
  dangerButton,
  ErrorAlert,
  EventStatusBadge,
  formatMoney,
  NoticeAlert,
  primaryButton,
  SeatsBar,
  secondaryButton,
  useApiError,
} from '../_shared';

type Tab = 'details' | 'registrations';

interface EventData {
  event: AdminEventDTO;
  registrations: RegistrationDTO[];
}

export default function AdminEventPage() {
  return (
    <AdminLoginGate probeUrl="/api/admin/events" title="Events">
      <Suspense fallback={null}>
        <EventDetail />
      </Suspense>
    </AdminLoginGate>
  );
}

function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab: Tab = searchParams.get('tab') === 'registrations' ? 'registrations' : 'details';
  const handleError = useApiError();

  const [data, setData] = useState<EventData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formDirty, setFormDirty] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch<EventData>(`/api/admin/events/${id}`)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(handleError(err));
      });
    return () => {
      cancelled = true;
    };
  }, [id, handleError]);

  const refresh = useCallback(async () => {
    try {
      const d = await apiFetch<EventData>(`/api/admin/events/${id}`);
      setData(d);
      setLoadError(null);
    } catch (err) {
      setLoadError(handleError(err));
    }
  }, [id, handleError]);

  const setEvent = (event: AdminEventDTO) => setData((prev) => (prev ? { ...prev, event } : prev));

  const updateRegistration = (registration: RegistrationDTO) =>
    setData((prev) =>
      prev
        ? { ...prev, registrations: prev.registrations.map((r) => (r.id === registration.id ? registration : r)) }
        : prev
    );

  const save = async (input: EventInput): Promise<string | null> => {
    try {
      const { event } = await apiFetch<{ event: AdminEventDTO }>(`/api/admin/events/${id}`, {
        method: 'PATCH',
        body: input,
      });
      setEvent(event);
      return null;
    } catch (err) {
      return handleError(err);
    }
  };

  const selectTab = (next: Tab) => {
    router.replace(next === 'details' ? `/admin/events/${id}` : `/admin/events/${id}?tab=${next}`, { scroll: false });
  };

  const tabClass = (active: boolean) =>
    `px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 rounded-t ${
      active ? 'border-sage-600 text-sage-700' : 'border-transparent text-gray-500 hover:text-gray-700'
    }`;

  if (!data) {
    return (
      <div className="py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackLink />
          <div className="mt-4">
            {loadError ? <ErrorAlert>{loadError}</ErrorAlert> : <p className="text-sm text-gray-500">Loading event...</p>}
          </div>
        </div>
      </div>
    );
  }

  const { event, registrations } = data;
  const activeRegistrations = registrations.filter((r) => r.status === 'confirmed' || r.status === 'pending').length;

  return (
    <div className="py-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <BackLink />
        <h1 className="mt-2 text-2xl font-bold text-gray-900 break-words">{event.title || 'Untitled event'}</h1>
        <p className="text-sm text-gray-600 mb-4">
          {formatEventWhen(event.startsAt, event.endsAt)}
          {event.location && ` · ${event.location}`}
        </p>

        {loadError && <ErrorAlert>{loadError}</ErrorAlert>}

        <StatusBar
          key={event.id}
          event={event}
          formDirty={formDirty}
          onEventChanged={setEvent}
          onRefresh={refresh}
          onDeleted={() => router.replace('/admin/events')}
          onDuplicated={(copy) => {
            setFormDirty(false);
            router.push(`/admin/events/${copy.id}`);
          }}
        />

        <div role="tablist" aria-label="Event sections" className="flex gap-2 border-b border-gray-200 mb-6">
          <button
            type="button"
            role="tab"
            id="tab-details"
            aria-selected={tab === 'details'}
            aria-controls="panel-details"
            onClick={() => selectTab('details')}
            className={tabClass(tab === 'details')}
          >
            Details
            {formDirty && <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-amber-500" aria-label="unsaved changes" />}
          </button>
          <button
            type="button"
            role="tab"
            id="tab-registrations"
            aria-selected={tab === 'registrations'}
            aria-controls="panel-registrations"
            onClick={() => selectTab('registrations')}
            className={tabClass(tab === 'registrations')}
          >
            Registrations <span className="text-gray-400 font-normal">({activeRegistrations})</span>
          </button>
        </div>

        {/* Both panels stay mounted so unsaved edits survive a tab switch. */}
        <div role="tabpanel" id="panel-details" aria-labelledby="tab-details" hidden={tab !== 'details'}>
          {event.status === 'cancelled' && (
            <p className="mb-4 text-sm text-gray-600">This event is cancelled, so its details can&apos;t be edited.</p>
          )}
          <EventForm
            key={event.id}
            event={event}
            onSave={save}
            onDirtyChange={setFormDirty}
            readOnly={event.status === 'cancelled'}
          />
        </div>
        <div role="tabpanel" id="panel-registrations" aria-labelledby="tab-registrations" hidden={tab !== 'registrations'}>
          <RegistrationsPanel
            key={event.id}
            event={event}
            registrations={registrations}
            onChanged={refresh}
            onRegistrationUpdated={updateRegistration}
          />
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/admin/events" className="text-sm text-sage-700 hover:text-sage-900 hover:underline">
      ← All events
    </Link>
  );
}

const dangerOutlineButton =
  'px-3 py-1.5 text-sm font-medium rounded-md bg-white border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2';

type BusyAction = 'publish' | 'unpublish' | 'delete' | 'duplicate';

function StatusBar({
  event,
  formDirty,
  onEventChanged,
  onRefresh,
  onDeleted,
  onDuplicated,
}: {
  event: AdminEventDTO;
  formDirty: boolean;
  onEventChanged: (event: AdminEventDTO) => void;
  onRefresh: () => Promise<void>;
  onDeleted: () => void;
  onDuplicated: (copy: AdminEventDTO) => void;
}) {
  const handleError = useApiError();
  const [busy, setBusy] = useState<BusyAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const missing: string[] = [];
  if (!event.title.trim()) missing.push('a title');
  if (!event.startsAt) missing.push('a date');
  if (!event.location.trim()) missing.push('a location');
  if (!(event.capacity >= 1)) missing.push('a capacity');
  const publishBlocked = missing.length > 0 || formDirty;

  const run = async (action: BusyAction, request: () => Promise<void>) => {
    setBusy(action);
    setError(null);
    setNotice(null);
    try {
      await request();
    } catch (err) {
      setError(handleError(err));
    } finally {
      setBusy(null);
    }
  };

  const publish = () =>
    run('publish', async () => {
      const { event: updated } = await apiFetch<{ event: AdminEventDTO }>(`/api/admin/events/${event.id}/publish`, {
        method: 'POST',
      });
      onEventChanged(updated);
      setNotice('Published. It’s live on the site now.');
    });

  const unpublish = () =>
    run('unpublish', async () => {
      const { event: updated } = await apiFetch<{ event: AdminEventDTO }>(
        `/api/admin/events/${event.id}/unpublish`,
        { method: 'POST' }
      );
      onEventChanged(updated);
      setNotice('Moved back to drafts. It’s off the site.');
    });

  const remove = () =>
    run('delete', async () => {
      await apiFetch<{ ok: true }>(`/api/admin/events/${event.id}`, { method: 'DELETE' });
      onDeleted();
    });

  const duplicate = () =>
    run('duplicate', async () => {
      const { event: copy } = await apiFetch<{ event: AdminEventDTO }>(`/api/admin/events/${event.id}/duplicate`, {
        method: 'POST',
      });
      onDuplicated(copy);
    });

  const handleCancelled = async ({ event: updated, refunded, failed }: CancelResult) => {
    setCancelOpen(false);
    onEventChanged(updated);
    const parts = ['Event cancelled and attendees emailed.'];
    if (refunded > 0) parts.push(`Refunded ${refunded} ${refunded === 1 ? 'payment' : 'payments'}.`);
    setNotice(parts.join(' '));
    if (failed > 0) {
      setError(
        `${failed} ${failed === 1 ? 'refund' : 'refunds'} didn’t go through. Refund ${failed === 1 ? 'it' : 'them'} from the Registrations tab or in Square.`
      );
    }
    await onRefresh();
  };

  const isPaid = event.pricePerSeat > 0 || event.revenueCents > 0;

  return (
    <div className={`${cardClass} p-4 mb-6`}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <EventStatusBadge event={event} />
            <span className="text-sm text-gray-900">
              {event.seatsTaken} of {event.capacity} sold
            </span>
            {isPaid && <span className="text-sm text-gray-600">{formatMoney(event.revenueCents)} revenue</span>}
            {event.waitlistCount > 0 && (
              <span className="text-sm text-amber-700">{event.waitlistCount} on the waitlist</span>
            )}
            {event.status === 'published' && (
              <a
                href={`/events/${event.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-sage-700 hover:text-sage-900 hover:underline"
              >
                View on site ↗
              </a>
            )}
          </div>
          <div className="max-w-md">
            <SeatsBar taken={event.seatsTaken} capacity={event.capacity} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {event.status === 'draft' && !confirmDelete && (
            <>
              <button
                type="button"
                onClick={publish}
                disabled={busy !== null || publishBlocked}
                className={primaryButton}
                aria-describedby={publishBlocked ? 'publish-blocked' : undefined}
              >
                {busy === 'publish' ? 'Publishing...' : 'Publish'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={busy !== null}
                className={secondaryButton}
              >
                Delete draft
              </button>
            </>
          )}
          {event.status === 'draft' && confirmDelete && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-900">Delete this draft for good?</span>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={busy !== null}
                className={secondaryButton}
              >
                Keep it
              </button>
              <button type="button" onClick={remove} disabled={busy !== null} className={dangerButton}>
                {busy === 'delete' ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          )}
          {event.status === 'published' && (
            <>
              <button type="button" onClick={unpublish} disabled={busy !== null} className={secondaryButton}>
                {busy === 'unpublish' ? 'Unpublishing...' : 'Unpublish'}
              </button>
              <button
                type="button"
                onClick={() => setCancelOpen(true)}
                disabled={busy !== null}
                className={dangerOutlineButton}
              >
                Cancel event…
              </button>
            </>
          )}
          <button type="button" onClick={duplicate} disabled={busy !== null} className={secondaryButton}>
            {busy === 'duplicate' ? 'Duplicating...' : 'Duplicate'}
          </button>
        </div>
      </div>

      {event.status === 'draft' && publishBlocked && (
        <p id="publish-blocked" className="mt-3 text-xs text-gray-500">
          {formDirty
            ? 'Save your changes before publishing.'
            : `Add ${missing.join(', ')} before publishing.`}
        </p>
      )}

      {(error || notice) && (
        <div className="mt-3 -mb-4">
          {error && <ErrorAlert>{error}</ErrorAlert>}
          {notice && <NoticeAlert onDismiss={() => setNotice(null)}>{notice}</NoticeAlert>}
        </div>
      )}

      {cancelOpen && (
        <CancelEventModal event={event} onClose={() => setCancelOpen(false)} onCancelled={handleCancelled} />
      )}
    </div>
  );
}
