'use client';

import { useCallback } from 'react';
import { useAdminAuth } from '@/components/admin/AdminLoginGate';
import type { CampaignStatus, NewsletterStatusDTO } from '@/lib/newsletter/types';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** JSON fetch for /api/admin/newsletter/*. Throws ApiError with the server's `{error}` message. */
export async function apiFetch<T>(url: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: options.method ?? 'GET',
      headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Couldn't reach the server. Check your connection and try again.");
  }

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) throw new ApiError(401, 'Your session has expired. Please log in again.');
    const message =
      data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
        ? data.error
        : `Something went wrong (error ${res.status}). Please try again.`;
    throw new ApiError(res.status, message);
  }
  return data as T;
}

/** Turns a thrown error into a message, and shows the login form on 401. */
export function useApiError(): (err: unknown) => string {
  const { markLoggedOut } = useAdminAuth();
  return useCallback(
    (err: unknown) => {
      if (err instanceof ApiError) {
        if (err.status === 401) markLoggedOut();
        return err.message;
      }
      return 'Something went wrong. Please try again.';
    },
    [markLoggedOut]
  );
}

const BADGE_STYLES: Record<CampaignStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  sending: 'bg-blue-50 text-blue-800 border-blue-200',
  sent: 'bg-green-50 text-green-800 border-green-200',
  paused: 'bg-amber-50 text-amber-800 border-amber-200',
};

const BADGE_LABELS: Record<CampaignStatus, string> = {
  draft: 'Draft',
  sending: 'Sending',
  sent: 'Sent',
  paused: 'Paused',
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border ${BADGE_STYLES[status]}`}
    >
      {status === 'sending' && (
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
        </span>
      )}
      {BADGE_LABELS[status]}
    </span>
  );
}

export function SetupNotices({ status }: { status: NewsletterStatusDTO | null }) {
  if (!status) return null;
  return (
    <>
      {!status.resendConfigured && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-md mb-4 text-sm">
          Sending isn&apos;t connected yet. Drafts and previews work; add the Resend key to send.
        </div>
      )}
      {!status.aiConfigured && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-md mb-4 text-sm">
          AI drafting isn&apos;t connected yet. You can still write newsletters by hand; add the AI Gateway key to
          draft with AI.
        </div>
      )}
    </>
  );
}

export function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const primaryButton =
  'px-4 py-2 bg-sage-600 text-white rounded-md hover:bg-sage-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2';

export const secondaryButton =
  'px-3 py-1.5 text-sm font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2';

export const dangerButton =
  'px-3 py-1.5 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2';

export const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500';
