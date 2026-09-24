'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from './CartProvider';

const PLACEHOLDER_IMAGE = '/images/products/placeholder-lavender.svg';

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * The lavender cart drawer (Square checkout). Cider has its own cart inside
 * VinoShipper, which is why this one is labeled.
 */
export default function Cart() {
  const { items, isOpen, closeCart, removeFromCart, updateQuantity, totalAmount, totalItems } = useCart();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop. Inline rgba on purpose: a Tailwind opacity class did not
          render reliably here. */}
      <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onClick={closeCart} />

      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-paper text-ink shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Lavender cart"
      >
        <div className="flex items-start justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 font-serif text-2xl leading-none">
              <span className="h-2.5 w-2.5 rounded-full bg-lav" aria-hidden="true" />
              Lavender cart
              <span className="text-base text-ink-3">({totalItems})</span>
            </h2>
            <p className="mt-1.5 text-xs text-ink-3">Cider checks out separately through VinoShipper.</p>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="-mr-2 -mt-1 rounded-full p-2 text-ink-2 transition-colors hover:bg-ground hover:text-ink"
            aria-label="Close cart"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="font-serif text-xl">Nothing in here yet</p>
              <p className="mt-1 text-sm text-ink-3">Add something from the lavender shop.</p>
              <Link href="/lavender" onClick={closeCart} className="btn btn-secondary mt-5">
                Browse the shop
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {items.map((item) => {
                const itemPrice = item.selectedVariation?.price || item.product.price;
                const itemImage = item.selectedVariation?.image || item.product.image || PLACEHOLDER_IMAGE;
                const key = `${item.product.id}-${item.selectedVariation?.id || 'default'}`;
                const alt = item.selectedVariation
                  ? `${item.product.name}, ${item.selectedVariation.name}`
                  : item.product.name;

                return (
                  <li key={key} className="flex gap-4 py-4">
                    <div className="relative h-20 w-20 flex-shrink-0 bg-ground-2">
                      <Image src={itemImage} alt={alt} fill sizes="80px" className="object-cover" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-serif text-[17px] leading-snug">{item.product.name}</h3>
                      {item.selectedVariation && (
                        <p className="mt-0.5 text-xs text-ink-3">{item.selectedVariation.name}</p>
                      )}
                      <p className="mt-1 text-sm text-ink-2">{formatPrice(itemPrice)}</p>

                      <div className="mt-2 inline-flex items-center rounded-full border border-line">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedVariation?.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-ground hover:text-ink"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedVariation?.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-ground hover:text-ink"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id, item.selectedVariation?.id)}
                      className="self-start text-xs text-ink-3 underline-offset-4 hover:text-ink hover:underline"
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="space-y-4 border-t border-line px-5 py-5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-ink-2">Subtotal</span>
              <span className="font-serif text-2xl">{formatPrice(totalAmount)}</span>
            </div>
            <p className="text-xs text-ink-3">Shipping is chosen at checkout. Pickup at the farm is free.</p>
            <Link href="/shop/checkout" onClick={closeCart} className="btn btn-primary w-full">
              Checkout
            </Link>
            <button
              type="button"
              onClick={closeCart}
              className="block w-full text-center text-sm text-ink-2 underline-offset-4 hover:text-ink hover:underline"
            >
              Keep shopping
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
