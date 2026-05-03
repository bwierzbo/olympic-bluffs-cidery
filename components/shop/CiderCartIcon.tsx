'use client';

import { useRouter, usePathname } from 'next/navigation';

// Cider orders go through VinoShipper, which is only loaded on /shop/cidery.
// Off that page the icon is a deep link to the cidery shop; on the page it
// pops VinoShipper's own cart. We can't read the VS cart count from outside
// the page, so this icon never shows a badge.
export default function CiderCartIcon() {
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = () => {
    if (pathname.startsWith('/shop/cidery')) {
      const vs = (window as unknown as { Vinoshipper?: { cartOpen?: () => void } }).Vinoshipper;
      if (vs && typeof vs.cartOpen === 'function') {
        vs.cartOpen();
        return;
      }
    }
    router.push('/shop/cidery');
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 text-white hover:text-sage-100 transition-colors"
      aria-label="Cider shop cart"
    >
      {/* Wine glass icon — visually distinct from the lavender shopping bag */}
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 3h8l-1 7a3 3 0 01-6 0L8 3zM12 13v7M9 21h6"
        />
      </svg>
    </button>
  );
}
