'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const LINKS = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/newsletter', label: 'Newsletter' },
  { href: '/admin/events', label: 'Events' },
];

/** Tab bar shown on every admin page (app/admin/layout.tsx). */
export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  async function logOut() {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      router.push('/admin');
      router.refresh();
      setLoggingOut(false);
    }
  }

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Admin">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href, l.exact) ? 'page' : undefined}
              className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                isActive(l.href, l.exact)
                  ? 'border-sage-600 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 py-2 text-sm">
          <Link href="/" className="rounded-md px-2.5 py-1.5 text-gray-600 hover:bg-gray-100">
            View site
          </Link>
          <button
            type="button"
            onClick={logOut}
            disabled={loggingOut}
            className="rounded-md px-2.5 py-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            {loggingOut ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      </div>
    </div>
  );
}
