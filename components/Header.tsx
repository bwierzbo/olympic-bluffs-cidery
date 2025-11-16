'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: 'HOME', href: '/' },
    { name: 'SHOP', href: '/products' },
    { name: 'HOURS & LOCATION', href: '/contact' },
    { name: 'ON THE FARM', href: '/farm' },
    { name: 'SALT & CEDAR B&B', href: '/salt-cedar-bnb' },
    { name: 'ABOUT US', href: '/about' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="bg-sage-500 sticky top-0 z-50">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:items-center lg:justify-center lg:py-3 lg:gap-1">
          {navigation.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-bold transition-colors tracking-wide px-4 py-px text-white border-t border-b border-white/60 hover:border-white"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Logo Section */}
        <div className="flex w-full items-center justify-between py-4 lg:justify-center lg:py-6">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/images/logo-horizontal.png"
                alt="Olympic Bluffs Cidery & Lavender Farm"
                width={400}
                height={100}
                className="h-16 w-auto lg:h-24"
                priority
              />
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              type="button"
              className="rounded-md p-2 text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open menu</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-sage-600">
            <div className="space-y-1 pb-3 pt-2">
              {navigation.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-sm font-medium text-white hover:border-sage-200 hover:bg-sage-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
