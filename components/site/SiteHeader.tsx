'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Cart from '@/components/shop/Cart';
import { LavenderCartButton, CiderCartButton } from './CartButtons';

/**
 * Single-row site header. Sits transparent over a photo hero (pages whose
 * <main> opens with a [data-hero] element) and turns solid once the page
 * scrolls or when there is no hero underneath.
 */

export const NAV_ITEMS = [
  { name: 'Visit', href: '/visit' },
  { name: 'The Farm', href: '/farm' },
  { name: 'Cider', href: '/cider' },
  { name: 'Lavender', href: '/lavender' },
  { name: 'Events', href: '/events' },
  { name: 'Stay', href: '/stay' },
  { name: 'Makers', href: '/makers' },
  { name: 'About', href: '/about' },
];

interface SiteHeaderProps {
  hoursLabel: string;
  eventPill: { label: string; href: string } | null;
}

export default function SiteHeader({ hoursLabel, eventPill }: SiteHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Whether the header sits over a photo hero is decided in CSS (globals.css,
  // `header[data-site-header]:has(+ main > [data-hero]:first-child)`), so the
  // first paint is already transparent. JS only tracks scroll position.
  // State is set from a frame callback / scroll events, never synchronously
  // in the effect body.
  useEffect(() => {
    const update = () => {
      setScrolled(window.scrollY > 24);
    };
    const frame = requestAnimationFrame(update);
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
    };
  }, [pathname]);

  // Lock page scroll while the sheet is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <header
        data-site-header
        data-scrolled={scrolled || undefined}
        data-menu-open={menuOpen || undefined}
        className="fixed inset-x-0 top-0 z-50 bg-ground/95 text-ink shadow-[0_1px_0_0_var(--color-line)] backdrop-blur transition-colors duration-300"
        style={{ ['--header-h' as string]: '64px' }}
      >
        <div className="container-x flex h-16 items-center justify-between gap-4">
          {/* Wordmark */}
          <Link href="/" className="flex flex-col leading-none" aria-label="Olympic Bluffs, home">
            <span className="font-serif text-[21px] tracking-[0.01em]">Olympic Bluffs</span>
            <span className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.2em] opacity-80">
              Cidery &amp; Lavender Farm
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 text-[13.5px] font-medium xl:flex" aria-label="Primary">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`border-b transition-colors ${
                  isActive(item.href)
                    ? 'border-current'
                    : 'border-transparent hover:border-current/50'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1 text-xs">
            {eventPill && (
              <Link
                href={eventPill.href}
                data-event-pill
                className="hidden rounded-full bg-lav-2 px-3 py-1.5 font-semibold text-lav transition-colors hover:bg-lav/20 lg:inline-block"
              >
                {eventPill.label}
              </Link>
            )}
            <span
              className="mr-1 hidden rounded-full border border-current px-3 py-1.5 opacity-90 lg:inline-block"
              title="Farm hours"
            >
              {hoursLabel}
            </span>
            <LavenderCartButton />
            <CiderCartButton />
            <button
              type="button"
              className="ml-1 flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-full xl:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span
                className={`block h-[2px] w-5 bg-current transition-transform ${
                  menuOpen ? 'translate-y-[7px] rotate-45' : ''
                }`}
              />
              <span className={`block h-[2px] w-5 bg-current transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
              <span
                className={`block h-[2px] w-5 bg-current transition-transform ${
                  menuOpen ? '-translate-y-[7px] -rotate-45' : ''
                }`}
              />
            </button>
          </div>
        </div>

      </header>
      {/* Mobile / tablet sheet. Rendered outside <header>: its backdrop-filter
          would otherwise become the containing block for this fixed panel and
          collapse it to the header's height. */}
        {menuOpen && (
          <div className="fixed inset-0 top-16 z-40 overflow-y-auto bg-ground xl:hidden">
            <nav className="container-x flex flex-col py-6" aria-label="Primary mobile">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`border-b border-line py-4 font-serif text-3xl ${
                    isActive(item.href) ? 'text-ink' : 'text-ink-2'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="mt-6 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-ink px-3 py-1.5">{hoursLabel}</span>
                {eventPill && (
                  <Link href={eventPill.href} onClick={() => setMenuOpen(false)} className="rounded-full bg-lav-2 px-3 py-1.5 font-semibold text-lav">
                    {eventPill.label}
                  </Link>
                )}
              </div>
              <p className="mt-6 text-sm text-ink-2">
                1025 Finn Hall Road, Port Angeles, WA
                <br />
                <a href="tel:+15714391311" className="underline underline-offset-4">
                  (571) 439-1311
                </a>
              </p>
            </nav>
          </div>
        )}

      {/* Lavender cart drawer (Square). Cider uses VinoShipper's own cart. */}
      <Cart />
    </>
  );
}
