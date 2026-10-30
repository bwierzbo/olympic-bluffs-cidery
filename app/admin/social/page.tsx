'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import AdminLoginGate from '@/components/admin/AdminLoginGate';
import type { AdminDeliveryDTO, AdminSocialDTO, AdminSocialPostDTO, ConnectionStatus, SyncResult } from '@/lib/social/types';
import {
  apiFetch,
  formatDate,
  formatDateTime,
  primaryButton,
  secondaryButton,
  useApiError,
} from '../newsletter/_shared';

const cardClass = 'bg-white rounded-lg shadow-sm border border-gray-200';

/** Messages for the ?tiktok= result the OAuth callback redirects back with. */
const TIKTOK_RESULTS: Record<string, { ok: boolean; text: string }> = {
  connected: { ok: true, text: 'TikTok is connected.' },
  denied: { ok: false, text: 'TikTok connection was cancelled.' },
  bad_state: { ok: false, text: 'That TikTok link expired. Click Connect TikTok again.' },
  error: { ok: false, text: 'TikTok connection failed. Try again in a minute.' },
};

export default function AdminSocialPage() {
  return (
    <AdminLoginGate probeUrl="/api/admin/social" title="Social">
      <SocialDashboard />
    </AdminLoginGate>
  );
}

function SocialDashboard() {
  const handleError = useApiError();
  const [data, setData] = useState<AdminSocialDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await apiFetch<AdminSocialDTO>('/api/admin/social'));
      setError(null);
    } catch (err) {
      setError(handleError(err));
    }
  }, [handleError]);

  useEffect(() => {
    load();
    // Read (then drop) the OAuth result without useSearchParams, which would need a Suspense boundary.
    const result = new URLSearchParams(window.location.search).get('tiktok');
    if (result) {
      setNotice(TIKTOK_RESULTS[result] ?? TIKTOK_RESULTS.error);
      window.history.replaceState(null, '', '/admin/social');
    }
  }, [load]);

  async function syncNow() {
    setSyncing(true);
    setNotice(null);
    try {
      const r = await apiFetch<SyncResult>('/api/admin/social/sync', { method: 'POST' });
      const parts = [
        `${r.imported} new post${r.imported === 1 ? '' : 's'}`,
        `${r.published} cross-post${r.published === 1 ? '' : 's'} sent`,
        r.failed ? `${r.failed} failed` : '',
      ].filter(Boolean);
      setNotice({
        ok: r.errors.length === 0 && r.failed === 0,
        text: `Synced: ${parts.join(', ')}.${r.errors.length ? ` ${r.errors[0]}` : ''}`,
      });
      await load();
    } catch (err) {
      setNotice({ ok: false, text: handleError(err) });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Social</h1>
          <button type="button" onClick={syncNow} disabled={syncing || !data} className={primaryButton}>
            {syncing ? 'Syncing…' : 'Sync now'}
          </button>
        </div>
        <p className="mb-6 text-sm text-gray-600 max-w-3xl">
          Post on Instagram only. New posts show on the homepage and are shared to Facebook, and videos to TikTok,
          within about 30 minutes. Add <code className="rounded bg-gray-100 px-1">#igonly</code> to a caption to keep
          a post off Facebook and TikTok.
        </p>

        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}
        {notice && (
          <div
            role="status"
            className={`px-4 py-3 rounded-md mb-4 text-sm border ${
              notice.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {notice.text}
          </div>
        )}
        {!data && !error && <p className="text-sm text-gray-500">Loading…</p>}

        {data && (
          <>
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <ConnectionCard name="Instagram" status={data.instagram}>
                <p className="mt-2 text-xs text-gray-500">
                  Last sync: {data.instagram.lastSyncAt ? formatDateTime(data.instagram.lastSyncAt) : 'never'}
                  {data.instagram.watchSince && <> · Watching since {formatDate(data.instagram.watchSince)}</>}
                </p>
                {data.instagram.lastSyncError && (
                  <p className="mt-2 text-xs text-red-700 whitespace-pre-line">{data.instagram.lastSyncError}</p>
                )}
              </ConnectionCard>
              <ConnectionCard name="Facebook" status={data.facebook} />
              <ConnectionCard name={`TikTok · ${data.tiktok.mode} mode`} status={data.tiktok} expiryLabel="Reconnect by">
                {/* A full page navigation so TikTok's consent screen can take over. */}
                {data.tiktok.appConfigured && (
                  <a href="/api/admin/social/tiktok/connect" className={`${secondaryButton} mt-3 inline-block`}>
                    {data.tiktok.configured ? 'Reconnect TikTok' : 'Connect TikTok'}
                  </a>
                )}
              </ConnectionCard>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent posts</h2>
            {data.posts.length === 0 ? (
              <div className={`${cardClass} px-4 py-10 text-center text-sm text-gray-500`}>
                No posts yet. Once Instagram is connected, click Sync now.
              </div>
            ) : (
              <ul className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {data.posts.map((post) => (
                  <PostCard key={post.id} post={post} onChanged={load} />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ConnectionCard({
  name,
  status,
  expiryLabel = 'Token expires',
  children,
}: {
  name: string;
  status: ConnectionStatus;
  expiryLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`${cardClass} p-4`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-gray-900">{name}</h3>
        <span
          className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${
            status.configured ? 'bg-green-50 text-green-800 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'
          }`}
        >
          {status.configured ? 'Connected' : 'Not set up'}
        </span>
      </div>
      <p className="mt-2 text-sm text-gray-600">{status.detail}</p>
      {status.expiresAt && (
        <p className="mt-1 text-xs text-gray-500">
          {expiryLabel} {formatDate(status.expiresAt)}
        </p>
      )}
      {children}
    </div>
  );
}

const DELIVERY_STYLES: Record<AdminDeliveryDTO['status'], string> = {
  pending: 'bg-blue-50 text-blue-800 border-blue-200',
  publishing: 'bg-blue-50 text-blue-800 border-blue-200',
  done: 'bg-green-50 text-green-800 border-green-200',
  failed: 'bg-red-50 text-red-800 border-red-200',
  skipped: 'bg-gray-100 text-gray-600 border-gray-200',
};

const PLATFORM_LABELS = { facebook: 'Facebook', tiktok: 'TikTok' } as const;

function PostCard({ post, onChanged }: { post: AdminSocialPostDTO; onChanged: () => Promise<void> }) {
  const handleError = useApiError();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(key: string, action: () => Promise<unknown>) {
    setBusy(key);
    setError(null);
    try {
      await action();
      await onChanged();
    } catch (err) {
      setError(handleError(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <li className={`${cardClass} overflow-hidden flex flex-col`}>
      <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="relative block aspect-square bg-gray-100">
        <Image
          src={post.imageUrl}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover ${post.hidden ? 'opacity-40' : ''}`}
        />
        <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">
          {post.mediaType === 'CAROUSEL_ALBUM' ? 'Album' : post.mediaType === 'VIDEO' ? 'Video' : 'Photo'}
        </span>
        {post.hidden && (
          <span className="absolute right-2 top-2 rounded bg-white/90 px-1.5 py-0.5 text-[11px] font-medium text-gray-800">
            Hidden
          </span>
        )}
      </a>
      <div className="p-3 flex flex-1 flex-col gap-2">
        <p className="text-xs text-gray-500">{formatDateTime(post.postedAt)}</p>
        <p className="text-sm text-gray-800 line-clamp-2">{post.caption || <span className="text-gray-400">No caption</span>}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {post.deliveries.map((d) => (
            <span key={d.id} className="inline-flex items-center gap-1">
              <span
                title={d.error ?? (d.status === 'done' && d.remoteId ? `ID ${d.remoteId}` : undefined)}
                className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${DELIVERY_STYLES[d.status]}`}
              >
                {PLATFORM_LABELS[d.platform]}: {d.status}
              </span>
              {d.status === 'failed' && (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => run(d.id, () => apiFetch(`/api/admin/social/deliveries/${d.id}/retry`, { method: 'POST' }))}
                  className="text-xs font-medium text-sage-700 underline underline-offset-2 disabled:opacity-50"
                >
                  {busy === d.id ? 'Retrying…' : 'Retry'}
                </button>
              )}
            </span>
          ))}
        </div>
        {error && <p className="text-xs text-red-700">{error}</p>}
        <button
          type="button"
          disabled={busy !== null}
          onClick={() =>
            run('hide', () => apiFetch(`/api/admin/social/posts/${post.id}`, { method: 'PATCH', body: { hidden: !post.hidden } }))
          }
          className={`${secondaryButton} mt-auto`}
        >
          {busy === 'hide' ? 'Saving…' : post.hidden ? 'Show on site' : 'Hide on site'}
        </button>
      </div>
    </li>
  );
}
