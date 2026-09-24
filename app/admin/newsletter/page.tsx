'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminLoginGate from '@/components/admin/AdminLoginGate';
import type { CampaignDTO, NewsletterStatusDTO, SubscriberDTO, SubscriberStatus } from '@/lib/newsletter/types';
import {
  apiFetch,
  CampaignStatusBadge,
  dangerButton,
  formatDate,
  formatDateTime,
  inputClass,
  primaryButton,
  secondaryButton,
  SetupNotices,
  useApiError,
} from './_shared';

type Tab = 'campaigns' | 'subscribers';

export default function AdminNewsletterPage() {
  return (
    <AdminLoginGate probeUrl="/api/admin/newsletter/status" title="Newsletter">
      <Suspense fallback={null}>
        <NewsletterDashboard />
      </Suspense>
    </AdminLoginGate>
  );
}

function NewsletterDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab: Tab = searchParams.get('tab') === 'subscribers' ? 'subscribers' : 'campaigns';
  const handleError = useApiError();

  const [status, setStatus] = useState<NewsletterStatusDTO | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<NewsletterStatusDTO>('/api/admin/newsletter/status')
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch((err) => {
        if (!cancelled) setStatusError(handleError(err));
      });
    return () => {
      cancelled = true;
    };
  }, [handleError]);

  const selectTab = (next: Tab) => {
    router.replace(next === 'campaigns' ? '/admin/newsletter' : `/admin/newsletter?tab=${next}`, { scroll: false });
  };

  const tabClass = (active: boolean) =>
    `px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 rounded-t ${
      active ? 'border-sage-600 text-sage-700' : 'border-transparent text-gray-500 hover:text-gray-700'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Newsletter</h1>
        </div>

        <SetupNotices status={status} />
        {statusError && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-4 text-sm">
            {statusError}
          </div>
        )}

        <div role="tablist" aria-label="Newsletter sections" className="flex gap-2 border-b border-gray-200 mb-6">
          <button
            type="button"
            role="tab"
            id="tab-campaigns"
            aria-selected={tab === 'campaigns'}
            aria-controls="panel-campaigns"
            onClick={() => selectTab('campaigns')}
            className={tabClass(tab === 'campaigns')}
          >
            Newsletters
          </button>
          <button
            type="button"
            role="tab"
            id="tab-subscribers"
            aria-selected={tab === 'subscribers'}
            aria-controls="panel-subscribers"
            onClick={() => selectTab('subscribers')}
            className={tabClass(tab === 'subscribers')}
          >
            Subscribers
            {status && <span className="ml-1.5 text-gray-400 font-normal">({status.subscribedCount})</span>}
          </button>
        </div>

        {tab === 'campaigns' ? (
          <div role="tabpanel" id="panel-campaigns" aria-labelledby="tab-campaigns">
            <CampaignsTab />
          </div>
        ) : (
          <div role="tabpanel" id="panel-subscribers" aria-labelledby="tab-subscribers">
            <SubscribersTab />
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Campaigns                                                           */
/* ------------------------------------------------------------------ */

function CampaignsTab() {
  const router = useRouter();
  const handleError = useApiError();
  const [campaigns, setCampaigns] = useState<CampaignDTO[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ campaigns: CampaignDTO[] }>('/api/admin/newsletter/campaigns')
      .then((data) => {
        if (!cancelled) setCampaigns(data.campaigns);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(handleError(err));
      });
    return () => {
      cancelled = true;
    };
  }, [handleError]);

  const createCampaign = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      const { campaign } = await apiFetch<{ campaign: CampaignDTO }>('/api/admin/newsletter/campaigns', {
        method: 'POST',
        body: {},
      });
      router.push(`/admin/newsletter/${campaign.id}`);
    } catch (err) {
      setCreateError(handleError(err));
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <p className="text-sm text-gray-600">Write a newsletter, preview it, send yourself a test, then send it.</p>
        <button type="button" onClick={createCampaign} disabled={creating} className={primaryButton}>
          {creating ? 'Creating...' : 'New newsletter'}
        </button>
      </div>

      {createError && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-4 text-sm">
          {createError}
        </div>
      )}
      {loadError && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-4 text-sm">
          {loadError}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="hidden md:grid grid-cols-[minmax(0,1fr)_7rem_12rem_10rem] gap-4 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
          <span>Subject</span>
          <span>Status</span>
          <span>Delivery</span>
          <span>Date</span>
        </div>

        {campaigns === null && !loadError && <p className="px-4 py-6 text-sm text-gray-500">Loading newsletters...</p>}

        {campaigns && campaigns.length === 0 && (
          <p className="px-4 py-8 text-sm text-gray-500 text-center">
            No newsletters yet. Click &ldquo;New newsletter&rdquo; to write your first one.
          </p>
        )}

        {campaigns && campaigns.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {campaigns.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/newsletter/${c.id}`}
                  className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_7rem_12rem_10rem] gap-1 md:gap-4 px-4 py-3 hover:bg-gray-50 focus:outline-none focus-visible:bg-sage-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sage-500"
                >
                  <span className={`truncate font-medium ${c.subject ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                    {c.subject || 'Untitled draft'}
                  </span>
                  <span>
                    <CampaignStatusBadge status={c.status} />
                  </span>
                  <span className="text-sm text-gray-600">
                    {c.status === 'draft' ? (
                      <span className="text-gray-400">&mdash;</span>
                    ) : (
                      <>
                        {c.sentCount} of {c.recipientCount} sent
                        {c.failedCount > 0 && <span className="text-red-700"> &middot; {c.failedCount} failed</span>}
                      </>
                    )}
                  </span>
                  <span className="text-sm text-gray-500">
                    {c.sentAt ? `Sent ${formatDate(c.sentAt)}` : `Created ${formatDate(c.createdAt)}`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Subscribers                                                         */
/* ------------------------------------------------------------------ */

type StatusFilter = 'all' | SubscriberStatus;

interface SubscribersResponse {
  subscribers: SubscriberDTO[];
  counts: { subscribed: number; unsubscribed: number };
}

function SubscribersTab() {
  const handleError = useApiError();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [reloadToken, setReloadToken] = useState(0);

  const queryKey = `${debouncedSearch}|${filter}|${reloadToken}`;
  const [result, setResult] = useState<{ key: string; data: SubscribersResponse } | null>(null);
  const [loadError, setLoadError] = useState<{ key: string; message: string } | null>(null);
  const loading = result?.key !== queryKey && loadError?.key !== queryKey;

  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [addMessage, setAddMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    const key = `${debouncedSearch}|${filter}|${reloadToken}`;
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (filter !== 'all') params.set('status', filter);
    const qs = params.toString();
    apiFetch<SubscribersResponse>(`/api/admin/newsletter/subscribers${qs ? `?${qs}` : ''}`)
      .then((data) => {
        if (!cancelled) setResult({ key, data });
      })
      .catch((err) => {
        if (!cancelled) setLoadError({ key, message: handleError(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, filter, reloadToken, handleError]);

  const reload = () => setReloadToken((n) => n + 1);

  const addSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newEmail.trim();
    if (!email) return;
    setAdding(true);
    setAddMessage(null);
    try {
      const { subscriber } = await apiFetch<{ subscriber: SubscriberDTO }>('/api/admin/newsletter/subscribers', {
        method: 'POST',
        body: { email },
      });
      setNewEmail('');
      setAddMessage({ ok: true, text: `Added ${subscriber.email}.` });
      reload();
    } catch (err) {
      setAddMessage({ ok: false, text: handleError(err) });
    } finally {
      setAdding(false);
    }
  };

  const toggleStatus = async (sub: SubscriberDTO) => {
    setBusyId(sub.id);
    setRowError(null);
    try {
      await apiFetch<{ subscriber: SubscriberDTO }>(`/api/admin/newsletter/subscribers/${sub.id}`, {
        method: 'PATCH',
        body: { status: sub.status === 'subscribed' ? 'unsubscribed' : 'subscribed' },
      });
      reload();
    } catch (err) {
      setRowError(handleError(err));
    } finally {
      setBusyId(null);
    }
  };

  const deleteSubscriber = async (sub: SubscriberDTO) => {
    setBusyId(sub.id);
    setRowError(null);
    try {
      await apiFetch<{ ok: true }>(`/api/admin/newsletter/subscribers/${sub.id}`, { method: 'DELETE' });
      setConfirmDeleteId(null);
      reload();
    } catch (err) {
      setRowError(handleError(err));
    } finally {
      setBusyId(null);
    }
  };

  const data = result?.data ?? null;
  const currentError = loadError?.key === queryKey ? loadError.message : null;

  return (
    <div className="space-y-4">
      {/* Counts + export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-3">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3 min-w-[8rem]">
            <div className="text-2xl font-bold text-gray-900">{data ? data.counts.subscribed : '–'}</div>
            <div className="text-xs text-gray-500">Subscribed</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3 min-w-[8rem]">
            <div className="text-2xl font-bold text-gray-900">{data ? data.counts.unsubscribed : '–'}</div>
            <div className="text-xs text-gray-500">Unsubscribed</div>
          </div>
        </div>
        <a href="/api/admin/newsletter/subscribers/export" download className={`${secondaryButton} self-start sm:self-auto`}>
          Export CSV
        </a>
      </div>

      {/* Add */}
      <form onSubmit={addSubscriber} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <label htmlFor="new-subscriber-email" className="block text-sm font-medium text-gray-700 mb-2">
          Add a subscriber
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="new-subscriber-email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="name@example.com"
            className={`${inputClass} sm:max-w-sm`}
            required
          />
          <button type="submit" disabled={adding || !newEmail.trim()} className={primaryButton}>
            {adding ? 'Adding...' : 'Add'}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">Only add people who asked to hear from you.</p>
        {addMessage && (
          <p role="status" className={`mt-2 text-sm ${addMessage.ok ? 'text-green-700' : 'text-red-700'}`}>
            {addMessage.text}
          </p>
        )}
      </form>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="sm:max-w-sm w-full">
          <label htmlFor="subscriber-search" className="sr-only">
            Search subscribers
          </label>
          <input
            id="subscriber-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email..."
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="subscriber-filter" className="sr-only">
            Filter by status
          </label>
          <select
            id="subscriber-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as StatusFilter)}
            className={`${inputClass} sm:w-auto`}
          >
            <option value="all">All</option>
            <option value="subscribed">Subscribed</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
        </div>
        {loading && <span className="self-center text-sm text-gray-500">Loading...</span>}
      </div>

      {(currentError || rowError) && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {currentError || rowError}
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="hidden md:grid grid-cols-[minmax(0,1fr)_8rem_8rem_8rem_14rem] gap-4 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
          <span>Email</span>
          <span>Source</span>
          <span>Joined</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {!data && !currentError && <p className="px-4 py-6 text-sm text-gray-500">Loading subscribers...</p>}

        {data && data.subscribers.length === 0 && (
          <p className="px-4 py-8 text-sm text-gray-500 text-center">
            {debouncedSearch || filter !== 'all' ? 'No subscribers match.' : 'No subscribers yet.'}
          </p>
        )}

        {data && data.subscribers.length > 0 && (
          <ul className={`divide-y divide-gray-100 ${loading ? 'opacity-60' : ''}`}>
            {data.subscribers.map((sub) => {
              const busy = busyId === sub.id;
              const confirming = confirmDeleteId === sub.id;
              return (
                <li
                  key={sub.id}
                  className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_8rem_8rem_8rem_14rem] gap-1 md:gap-4 px-4 py-3 md:items-center"
                >
                  <span className="truncate font-medium text-gray-900" title={sub.email}>
                    {sub.email}
                  </span>
                  <span className="text-sm text-gray-600">{sub.source || '—'}</span>
                  <span className="text-sm text-gray-600" title={formatDateTime(sub.createdAt)}>
                    {formatDate(sub.createdAt)}
                  </span>
                  <span>
                    {sub.status === 'subscribed' ? (
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full border bg-green-50 text-green-800 border-green-200">
                        Subscribed
                      </span>
                    ) : (
                      <span
                        className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full border bg-gray-100 text-gray-600 border-gray-200"
                        title={sub.unsubscribedAt ? `Unsubscribed ${formatDateTime(sub.unsubscribedAt)}` : undefined}
                      >
                        Unsubscribed
                      </span>
                    )}
                  </span>
                  <span className="flex flex-wrap md:justify-end gap-2 mt-2 md:mt-0">
                    {confirming ? (
                      <>
                        <span className="self-center text-sm text-gray-700">Delete for good?</span>
                        <button
                          type="button"
                          onClick={() => deleteSubscriber(sub)}
                          disabled={busy}
                          className={dangerButton}
                        >
                          {busy ? 'Deleting...' : 'Delete'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={busy}
                          className={secondaryButton}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleStatus(sub)}
                          disabled={busy}
                          className={secondaryButton}
                          aria-label={`${sub.status === 'subscribed' ? 'Unsubscribe' : 'Resubscribe'} ${sub.email}`}
                        >
                          {busy ? 'Saving...' : sub.status === 'subscribed' ? 'Unsubscribe' : 'Resubscribe'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(sub.id)}
                          disabled={busy}
                          className={`${secondaryButton} text-red-700`}
                          aria-label={`Delete ${sub.email}`}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
