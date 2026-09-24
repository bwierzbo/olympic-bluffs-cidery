'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminLoginGate from '@/components/admin/AdminLoginGate';
import EventForm from '@/components/admin/events/EventForm';
import type { AdminEventDTO, EventInput } from '@/lib/events/types';
import { apiFetch, useApiError } from '../_shared';

export default function NewEventPage() {
  return (
    <AdminLoginGate probeUrl="/api/admin/events" title="Events">
      <NewEvent />
    </AdminLoginGate>
  );
}

function NewEvent() {
  const router = useRouter();
  const handleError = useApiError();

  const create = async (input: EventInput): Promise<string | null> => {
    try {
      const { event } = await apiFetch<{ event: AdminEventDTO }>('/api/admin/events', {
        method: 'POST',
        body: input,
      });
      router.replace(`/admin/events/${event.id}`);
      return null;
    } catch (err) {
      return handleError(err);
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/admin/events" className="text-sm text-sage-700 hover:text-sage-900 hover:underline">
          ← All events
        </Link>
        <h1 className="mt-2 mb-1 text-2xl font-bold text-gray-900">New event</h1>
        <p className="mb-6 text-sm text-gray-600">
          It starts as a draft. Nobody sees it on the site until you publish it.
        </p>
        <EventForm event={null} onSave={create} />
      </div>
    </div>
  );
}
