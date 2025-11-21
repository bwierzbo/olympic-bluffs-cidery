'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import CartIcon from './shop/CartIcon';
import Cart from './shop/Cart';

type NavigationItem = {
  name: string;
  href?: string;
  children?: { name: string; href: string }[];
};

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);
  const [desktopShopOpen, setDesktopShopOpen] = useState(false);
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);
  const pathname = usePathname();

  const handleMouseEnter = () => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    setDesktopShopOpen(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setDesktopShopOpen(false);
    }, 200); // 200ms delay before closing
    setCloseTimeout(timeout);
  };

  const navigation: NavigationItem[] = [
    { name: 'HOME', href: '/' },
    {
      name: 'SHOP',
      children: [
        { name: 'Lavender', href: '/shop/lavender' },
        { name: 'Cidery', href: '/shop/cidery' }
      ]
    },
    { name: 'HOURS & LOCATION', href: '/contact' },
    { name: 'ON THE FARM', href: '/farm' },
    { name: 'SALT & CEDAR B&B', href: '/salt-cedar-bnb' },
    { name: 'ABOUT US', href: '/about' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const isShopActive = () => {
    return pathname.startsWith('/shop') || pathname.startsWith('/products');
  };

  return (
    <header className="bg-sage-500 sticky top-0 z-50">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:items-center lg:justify-between lg:py-3">
          <div className="flex items-center gap-1 flex-1 justify-center">
            {navigation.map((item) => (
              item.children ? (
                // Dropdown menu item
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    className={`text-sm font-bold transition-colors tracking-wide px-4 py-px text-white border-t border-b flex items-center gap-1 ${
                      isShopActive()
                        ? 'border-gray-400'
                        : 'border-white/60 hover:border-white'
                    }`}
                  >
                    {item.name}
                    <svg
                      className={`w-3 h-3 transition-transform ${desktopShopOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  {/* Dropdown Menu */}
                  {desktopShopOpen && (
                    <div className="absolute left-0 top-full w-40 bg-white rounded-md shadow-lg py-1 z-50">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={`block px-4 py-2 text-sm font-medium transition-colors ${
                            isActive(child.href)
                              ? 'bg-sage-100 text-sage-900'
                              : 'text-gray-700 hover:bg-sage-50'
                          }`}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Regular link
                <Link
                  key={item.name}
                  href={item.href!}
                  className={`text-sm font-bold transition-colors tracking-wide px-4 py-px text-white border-t border-b ${
                    isActive(item.href!)
                      ? 'border-gray-400'
                      : 'border-white/60 hover:border-white'
                  }`}
                >
                  {item.name}
                </Link>
              )
            ))}
          </div>
          {/* Cart Icon - Desktop only, far right */}
          <div className="ml-4">
            <CartIcon />
          </div>
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

          {/* Mobile menu and cart buttons */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Cart Icon - Mobile only */}
            <CartIcon />

            {/* Mobile menu button */}
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
              {navigation.map((item) => (
                item.children ? (
                  // Dropdown menu item
                  <div key={item.name}>
                    <button
                      onClick={() => setMobileShopOpen(!mobileShopOpen)}
                      className={`flex w-full items-center justify-between border-l-4 py-2 pl-3 pr-4 text-sm font-medium text-white hover:bg-sage-700 ${
                        isShopActive()
                          ? 'border-gray-400 bg-sage-700'
                          : 'border-transparent hover:border-sage-200'
                      }`}
                    >
                      <span>{item.name}</span>
                      <svg
                        className={`w-4 h-4 transition-transform ${mobileShopOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    {/* Submenu */}
                    {mobileShopOpen && (
                      <div className="bg-sage-700">
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            className={`block border-l-4 py-2 pl-8 pr-4 text-sm font-medium text-white hover:bg-sage-800 ${
                              isActive(child.href)
                                ? 'border-gray-400 bg-sage-800'
                                : 'border-transparent'
                            }`}
                            onClick={() => {
                              setMobileMenuOpen(false);
                              setMobileShopOpen(false);
                            }}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Regular link
                  <Link
                    key={item.name}
                    href={item.href!}
                    className={`block border-l-4 py-2 pl-3 pr-4 text-sm font-medium text-white hover:bg-sage-700 ${
                      isActive(item.href!)
                        ? 'border-gray-400 bg-sage-700'
                        : 'border-transparent hover:border-sage-200'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                )
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Shopping Cart Sidebar */}
      <Cart />
    </header>
  );
}
