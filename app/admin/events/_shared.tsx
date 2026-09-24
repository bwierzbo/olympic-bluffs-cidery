'use client';

import { useEffect, type ReactNode } from 'react';
import type { AdminEventDTO, RegistrationStatus } from '@/lib/events/types';

export {
  apiFetch,
  ApiError,
  dangerButton,
  inputClass,
  primaryButton,
  secondaryButton,
  useApiError,
} from '../newsletter/_shared';

export const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
export const helpClass = 'mt-1 text-xs text-gray-500';
export const cardClass = 'bg-white rounded-lg shadow-sm border border-gray-200';

/** "$90" for whole dollars, "$12.50" otherwise. */
export function formatMoney(cents: number): string {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function formatPrice(pricePerSeat: number): string {
  return pricePerSeat === 0 ? 'Free' : `${formatMoney(pricePerSeat)} / seat`;
}

type EventBadgeKind = 'draft' | 'published' | 'sold_out' | 'cancelled';

const EVENT_BADGE_STYLES: Record<EventBadgeKind, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  published: 'bg-green-50 text-green-800 border-green-200',
  sold_out: 'bg-amber-50 text-amber-800 border-amber-200',
  cancelled: 'bg-red-50 text-red-800 border-red-200',
};

const EVENT_BADGE_LABELS: Record<EventBadgeKind, string> = {
  draft: 'Draft',
  published: 'Published',
  sold_out: 'Sold out',
  cancelled: 'Cancelled',
};

export function EventStatusBadge({ event }: { event: Pick<AdminEventDTO, 'status' | 'seatsLeft'> }) {
  const kind: EventBadgeKind =
    event.status === 'published' && event.seatsLeft === 0 ? 'sold_out' : event.status;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border whitespace-nowrap ${EVENT_BADGE_STYLES[kind]}`}
    >
      {EVENT_BADGE_LABELS[kind]}
    </span>
  );
}

const REGISTRATION_BADGE_STYLES: Record<RegistrationStatus, string> = {
  pending: 'bg-blue-50 text-blue-800 border-blue-200',
  confirmed: 'bg-green-50 text-green-800 border-green-200',
  waitlist: 'bg-amber-50 text-amber-800 border-amber-200',
  cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
  refunded: 'bg-red-50 text-red-800 border-red-200',
};

const REGISTRATION_BADGE_LABELS: Record<RegistrationStatus, string> = {
  pending: 'Paying',
  confirmed: 'Confirmed',
  waitlist: 'Waitlist',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export function RegistrationStatusBadge({ status }: { status: RegistrationStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border whitespace-nowrap ${REGISTRATION_BADGE_STYLES[status]}`}
    >
      {REGISTRATION_BADGE_LABELS[status]}
    </span>
  );
}

export function ErrorAlert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-4 text-sm">
      {children}
    </div>
  );
}

export function NoticeAlert({ children, onDismiss }: { children: ReactNode; onDismiss?: () => void }) {
  return (
    <div
      role="status"
      className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md mb-4 text-sm flex items-start justify-between gap-3"
    >
      <div>{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-green-700 hover:text-green-900 text-xs font-medium underline"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}

/** Seats sold out of capacity, as a bar. */
export function SeatsBar({ taken, capacity }: { taken: number; capacity: number }) {
  const pct = capacity > 0 ? Math.min(100, Math.round((taken / capacity) * 100)) : 0;
  return (
    <div
      className="h-2 w-full rounded-full bg-gray-100 overflow-hidden"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={capacity}
      aria-valuenow={taken}
      aria-label={`${taken} of ${capacity} seats sold`}
    >
      <div className={`h-full ${pct >= 100 ? 'bg-amber-500' : 'bg-sage-600'}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Centered dialog over a dimmed page. Escape and backdrop clicks close it unless `busy`. */
export function Modal({
  titleId,
  title,
  busy,
  onClose,
  children,
}: {
  titleId: string;
  title: string;
  busy: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, busy]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="w-8 h-8 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-500"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
