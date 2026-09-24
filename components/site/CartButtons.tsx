'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/components/shop/CartProvider';

/**
 * Two carts, kept deliberately separate: lavender checks out through Square,
 * cider through VinoShipper (a licensed alcohol shipper). Icon-only buttons,
 * visually distinct (bag vs. glass), with the label as tooltip and for
 * assistive tech.
 */

const base =
  'relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current';

export function LavenderCartButton() {
  const { totalItems, openCart } = useCart();
  const label = `Lavender cart, ${totalItems} ${totalItems === 1 ? 'item' : 'items'}`;
  return (
    <button type="button" onClick={openCart} className={base} aria-label={label} title="Lavender cart">
      <svg className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"
        />
      </svg>
      {totalItems > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-lav px-1 text-[10.5px] font-bold leading-none text-white tabular-nums">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </button>
  );
}

export function CiderCartButton() {
  const router = useRouter();
  const pathname = usePathname();

  // VinoShipper's cart only exists on /cider. Elsewhere the button is a deep
  // link. On the page it opens VS's cart, falling back to scrolling to the
  // catalog (VS's focus trap throws when the cart is empty, and there is no
  // way to read the count from outside, so no badge is shown).
  const handleClick = () => {
    if (pathname.startsWith('/cider')) {
      const vs = (window as unknown as { Vinoshipper?: { cartOpen?: () => void } }).Vinoshipper;
      if (vs && typeof vs.cartOpen === 'function') {
        try {
          vs.cartOpen();
          return;
        } catch {
          /* empty cart */
        }
      }
      document.getElementById('ciders')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    router.push('/cider#ciders');
  };

  return (
    <button type="button" onClick={handleClick} className={base} aria-label="Cider cart" title="Cider cart">
      <svg className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 3h8l-1 7a3 3 0 01-6 0L8 3zM12 13v7M9 21h6" />
      </svg>
    </button>
  );
}
