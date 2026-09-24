'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import AdminLoginGate, { useAdminAuth } from '@/components/admin/AdminLoginGate';
import type { AdminOverview } from '@/lib/admin-overview';

const money = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);

const shortDate = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' }).format(new Date(iso));

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'To process',
  processing: 'Processing',
  ready: 'Ready for pickup',
  shipped: 'Shipped',
  on_hold: 'On hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_STYLE: Record<string, string> = {
  confirmed: 'bg-blue-50 text-blue-700 ring-blue-200',
  processing: 'bg-amber-50 text-amber-800 ring-amber-200',
  ready: 'bg-violet-50 text-violet-700 ring-violet-200',
  shipped: 'bg-sky-50 text-sky-700 ring-sky-200',
  on_hold: 'bg-red-50 text-red-700 ring-red-200',
  completed: 'bg-green-50 text-green-700 ring-green-200',
  cancelled: 'bg-gray-100 text-gray-600 ring-gray-200',
};

function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/Los_Angeles' }).format(new Date())
  );
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function AdminHomePage() {
  return (
    <AdminLoginGate probeUrl="/api/admin/overview" title="Olympic Bluffs admin">
      <Dashboard />
    </AdminLoginGate>
  );
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">{value}</dd>
      {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function Card({
  title,
  description,
  href,
  action,
  children,
}: {
  title: string;
  description: string;
  href: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            <Link href={href} className="hover:underline">
              {title}
            </Link>
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">{description}</p>
        </div>
        {action}
      </div>
      <div className="flex flex-1 flex-col px-5 py-4">{children}</div>
      <div className="border-t border-gray-100 px-5 py-3">
        <Link href={href} className="text-sm font-medium text-sage-700 hover:text-sage-900">
          Open {title.toLowerCase()} →
        </Link>
      </div>
    </section>
  );
}

function Dashboard() {
  const router = useRouter();
  const { markLoggedOut } = useAdminAuth();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/overview', { cache: 'no-store' });
      if (res.status === 401) {
        markLoggedOut();
        return;
      }
      if (!res.ok) throw new Error('Could not load the dashboard.');
      setData((await res.json()) as AdminOverview);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the dashboard.');
    }
  }, [markLoggedOut]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/overview', { cache: 'no-store' })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) return markLoggedOut();
        if (!res.ok) throw new Error('Could not load the dashboard.');
        setData((await res.json()) as AdminOverview);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load the dashboard.');
      });
    return () => {
      cancelled = true;
    };
  }, [markLoggedOut]);

  async function newNewsletter() {
    setCreating(true);
    try {
      const res = await fetch('/api/admin/newsletter/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (res.status === 401) return markLoggedOut();
      const json = (await res.json()) as { campaign?: { id: string }; error?: string };
      if (!res.ok || !json.campaign) throw new Error(json.error || 'Could not create a newsletter.');
      router.push(`/admin/newsletter/${json.campaign.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create a newsletter.');
      setCreating(false);
    }
  }

  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Los_Angeles',
  }).format(new Date());

  const attention: Array<{ label: string; href: string; tone: 'blue' | 'violet' | 'red' | 'amber' }> = [];
  if (data) {
    const o = data.orders;
    if (o.toProcess > 0)
      attention.push({ label: `${o.toProcess} new order${o.toProcess === 1 ? '' : 's'} to process`, href: '/admin/orders', tone: 'blue' });
    if (o.readyForPickup > 0)
      attention.push({ label: `${o.readyForPickup} waiting for pickup`, href: '/admin/orders', tone: 'violet' });
    if (o.onHold > 0) attention.push({ label: `${o.onHold} order${o.onHold === 1 ? '' : 's'} on hold`, href: '/admin/orders', tone: 'red' });
    if (data.newsletter.sending > 0)
      attention.push({ label: 'A newsletter is sending or paused', href: '/admin/newsletter', tone: 'amber' });
  }
  const toneClass = {
    blue: 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100',
    violet: 'border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100',
    red: 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100',
    amber: 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100',
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">{today}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">{greeting()}</h1>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                data.squareMode === 'production'
                  ? 'bg-green-50 text-green-700 ring-green-200'
                  : 'bg-amber-50 text-amber-800 ring-amber-200'
              }`}
              title="Which Square account lavender checkout charges"
            >
              Square: {data.squareMode === 'production' ? 'live payments' : 'sandbox (test cards only)'}
            </span>
          )}
          <button
            type="button"
            onClick={load}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}

      {!data && !error && <p className="mt-10 text-sm text-gray-500">Loading…</p>}

      {data && (
        <>
          <section className="mt-6" aria-label="Needs attention">
            {attention.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {attention.map((a) => (
                  <li key={a.label}>
                    <Link href={a.href} className={`inline-flex rounded-full border px-3 py-1.5 text-sm font-medium ${toneClass[a.tone]}`}>
                      {a.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-800">
                All caught up. Nothing needs attention.
              </p>
            )}
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card title="Orders" description="Lavender shop orders paid through Square." href="/admin/orders">
              <dl className="grid grid-cols-3 gap-4">
                <Stat label="To process" value={data.orders.toProcess} />
                <Stat label="Last 7 days" value={data.orders.last7Days} />
                <Stat label="Revenue" value={money(data.orders.revenueLast30DaysCents)} hint="Last 30 days" />
              </dl>
              <h3 className="mt-6 text-xs font-medium uppercase tracking-wide text-gray-500">Recent</h3>
              {data.orders.recent.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">No orders yet.</p>
              ) : (
                <ul className="mt-2 divide-y divide-gray-100">
                  {data.orders.recent.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{o.customerName}</p>
                        <p className="text-xs text-gray-500">
                          {shortDate(o.createdAt)} · {o.fulfillmentMethod === 'shipping' ? 'Ship' : 'Pickup'}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                            STATUS_STYLE[o.status] ?? STATUS_STYLE.cancelled
                          }`}
                        >
                          {STATUS_LABEL[o.status] ?? o.status}
                        </span>
                        <span className="w-14 text-right tabular-nums text-gray-700">{money(o.totalCents)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-auto pt-4 text-xs text-gray-500">
                Cider orders are handled in VinoShipper.{' '}
                <a href="https://vinoshipper.com" target="_blank" rel="noopener noreferrer" className="underline">
                  Open VinoShipper
                </a>
              </p>
            </Card>

            <Card
              title="Newsletter"
              description="Write with the AI assistant and send through Resend."
              href="/admin/newsletter"
              action={
                <button
                  type="button"
                  onClick={newNewsletter}
                  disabled={creating}
                  className="shrink-0 rounded-md bg-sage-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sage-700 disabled:opacity-50"
                >
                  {creating ? 'Creating…' : 'New newsletter'}
                </button>
              }
            >
              <dl className="grid grid-cols-3 gap-4">
                <Stat label="Subscribers" value={data.newsletter.subscribed} />
                <Stat label="New" value={data.newsletter.newLast30Days} hint="Last 30 days" />
                <Stat label="Drafts" value={data.newsletter.drafts} />
              </dl>
              <h3 className="mt-6 text-xs font-medium uppercase tracking-wide text-gray-500">Last sent</h3>
              {data.newsletter.lastSent ? (
                <Link
                  href={`/admin/newsletter/${data.newsletter.lastSent.id}`}
                  className="mt-2 block rounded-md border border-gray-100 px-3 py-2 hover:bg-gray-50"
                >
                  <p className="truncate text-sm font-medium text-gray-900">{data.newsletter.lastSent.subject}</p>
                  <p className="text-xs text-gray-500">
                    {shortDate(data.newsletter.lastSent.sentAt)} · sent to {data.newsletter.lastSent.sentCount}
                  </p>
                </Link>
              ) : (
                <p className="mt-2 text-sm text-gray-500">Nothing sent yet.</p>
              )}
            </Card>

            <Card title="Events" description="Festival, classes and tastings on the farm." href="/admin/events">
              <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">Coming up on the site</h3>
              {data.events.upcoming.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">No upcoming events listed.</p>
              ) : (
                <ul className="mt-2 divide-y divide-gray-100">
                  {data.events.upcoming.map((e) => (
                    <li key={`${e.title}-${e.dates}`} className="py-2 text-sm">
                      <p className="font-medium text-gray-900">{e.title}</p>
                      <p className="text-xs text-gray-500">{e.dates}</p>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-auto rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-2.5 pt-2.5 text-xs text-gray-600">
                Creating events with seat limits, payment and email confirmation is the next phase. Today, events are
                edited in the site&apos;s events file.
              </div>
            </Card>
          </div>

          <section className="mt-8" aria-label="Other tools">
            <h2 className="text-xs font-medium uppercase tracking-wide text-gray-500">Other tools</h2>
            <ul className="mt-2 flex flex-wrap gap-2 text-sm">
              {[
                { label: 'Square dashboard', href: 'https://squareup.com/dashboard' },
                { label: 'VinoShipper', href: 'https://vinoshipper.com' },
                { label: 'Resend (email delivery)', href: 'https://resend.com/emails' },
                { label: 'Vercel (hosting)', href: 'https://vercel.com/dashboard' },
              ].map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-md border border-gray-300 bg-white px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                  >
                    {l.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
