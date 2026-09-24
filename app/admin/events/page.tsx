'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLoginGate from '@/components/admin/AdminLoginGate';
import { formatEventWhen } from '@/components/admin/events/pacific';
import type { AdminEventDTO } from '@/lib/events/types';
import {
  apiFetch,
  cardClass,
  ErrorAlert,
  EventStatusBadge,
  formatMoney,
  formatPrice,
  primaryButton,
  useApiError,
} from './_shared';

export default function AdminEventsPage() {
  return (
    <AdminLoginGate probeUrl="/api/admin/events" title="Events">
      <EventsList />
    </AdminLoginGate>
  );
}

interface Loaded {
  events: AdminEventDTO[];
  /** When the list was fetched; decides upcoming vs past. */
  now: number;
}

function EventsList() {
  const handleError = useApiError();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ events: AdminEventDTO[] }>('/api/admin/events')
      .then((data) => {
        if (!cancelled) setLoaded({ events: data.events, now: Date.now() });
      })
      .catch((err) => {
        if (!cancelled) setLoadError(handleError(err));
      });
    return () => {
      cancelled = true;
    };
  }, [handleError]);

  const upcoming: AdminEventDTO[] = [];
  const drafts: AdminEventDTO[] = [];
  const past: AdminEventDTO[] = [];
  if (loaded) {
    for (const event of loaded.events) {
      if (event.status === 'draft') drafts.push(event);
      else if (event.status === 'published' && new Date(event.endsAt).getTime() > loaded.now) upcoming.push(event);
      else past.push(event);
    }
    // Most recent first for the history.
    past.reverse();
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <Link href="/admin/events/new" className={`${primaryButton} text-center`}>
            New event
          </Link>
        </div>
        <p className="mb-6 text-sm text-gray-600 max-w-3xl">
          Classes, tastings and workshops people register and pay for. The Lavender Festival and outside events (like
          Yoga + Cider) are listed separately on the site.
        </p>

        {loadError && <ErrorAlert>{loadError}</ErrorAlert>}
        {!loaded && !loadError && <p className="text-sm text-gray-500">Loading events...</p>}

        {loaded && loaded.events.length === 0 && (
          <div className={`${cardClass} px-4 py-10 text-center text-sm text-gray-500`}>
            No events yet. Click &ldquo;New event&rdquo; to set up your first class or tasting.
          </div>
        )}

        {loaded && loaded.events.length > 0 && (
          <div className="space-y-8">
            <EventGroup title="Upcoming" events={upcoming} empty="Nothing published and coming up." />
            <EventGroup title="Drafts" events={drafts} empty="No drafts." />
            {past.length > 0 && (
              <details className="group">
                <summary className="cursor-pointer select-none text-lg font-semibold text-gray-900 mb-3 list-none flex items-center gap-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">
                  <span className="inline-block transition-transform group-open:rotate-90" aria-hidden="true">
                    ▸
                  </span>
                  Past &amp; cancelled
                  <span className="text-sm font-normal text-gray-500">({past.length})</span>
                </summary>
                <EventRows events={past} />
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EventGroup({ title, events, empty }: { title: string; events: AdminEventDTO[]; empty: string }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        {title}
        {events.length > 0 && <span className="ml-2 text-sm font-normal text-gray-500">({events.length})</span>}
      </h2>
      {events.length === 0 ? <p className="text-sm text-gray-500">{empty}</p> : <EventRows events={events} />}
    </section>
  );
}

function EventRows({ events }: { events: AdminEventDTO[] }) {
  return (
    <ul className={`${cardClass} divide-y divide-gray-100 overflow-hidden`}>
      {events.map((event) => (
        <li key={event.id}>
          <Link
            href={`/admin/events/${event.id}`}
            className="block px-4 py-3 hover:bg-gray-50 focus:outline-none focus-visible:bg-gray-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sage-500"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900 break-words">{event.title || 'Untitled event'}</span>
                  <EventStatusBadge event={event} />
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{formatEventWhen(event.startsAt, event.endsAt)}</p>
              </div>
              <dl className="grid grid-cols-3 md:flex md:items-center gap-x-6 gap-y-1 text-sm shrink-0">
                <div className="md:w-32">
                  <dt className="sr-only">Seats</dt>
                  <dd className="text-gray-900">
                    {event.seatsTaken} of {event.capacity} sold
                  </dd>
                  {event.waitlistCount > 0 && <dd className="text-xs text-amber-700">{event.waitlistCount} waitlist</dd>}
                </div>
                <div className="md:w-24">
                  <dt className="sr-only">Price</dt>
                  <dd className="text-gray-700">{formatPrice(event.pricePerSeat)}</dd>
                </div>
                <div className="md:w-24 md:text-right">
                  <dt className="sr-only">Revenue</dt>
                  <dd className="text-gray-900 font-medium">
                    {event.pricePerSeat === 0 && event.revenueCents === 0 ? '—' : formatMoney(event.revenueCents)}
                  </dd>
                </div>
              </dl>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
