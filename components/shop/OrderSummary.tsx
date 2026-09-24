'use client';

import Image from 'next/image';
import { useCart } from './CartProvider';

interface OrderSummaryProps {
  shippingCost?: number;
}

const PLACEHOLDER_IMAGE = '/images/products/placeholder-lavender.svg';

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function OrderSummary({ shippingCost = 0 }: OrderSummaryProps) {
  const { items, totalAmount } = useCart();

  const tax = 0; // Calculate tax if needed
  const total = totalAmount + shippingCost + tax;

  return (
    <div className="border border-line bg-paper p-6">
      <h2 className="font-serif text-2xl leading-none">Order summary</h2>
      <p className="mt-1.5 text-xs text-ink-3">Lavender only. Cider checks out separately through VinoShipper.</p>

      <ul className="mt-5 divide-y divide-line border-y border-line">
        {items.map((item) => {
          const unitPrice = item.selectedVariation?.price ?? item.product.price;
          const image = item.selectedVariation?.image || item.product.image || PLACEHOLDER_IMAGE;
          const key = `${item.product.id}-${item.selectedVariation?.id || 'default'}`;
          return (
            <li key={key} className="flex gap-3 py-3">
              <div className="relative h-14 w-14 flex-shrink-0 bg-ground-2">
                <Image src={image} alt={item.product.name} fill sizes="56px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.product.name}</p>
                {item.selectedVariation && <p className="text-xs text-ink-3">{item.selectedVariation.name}</p>}
                <p className="text-xs text-ink-3">
                  {item.quantity} × {formatPrice(unitPrice)}
                </p>
              </div>
              <div className="text-sm tabular-nums">{formatPrice(unitPrice * item.quantity)}</div>
            </li>
          );
        })}
      </ul>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-2">Subtotal</dt>
          <dd className="tabular-nums">{formatPrice(totalAmount)}</dd>
        </div>
        {shippingCost > 0 && (
          <div className="flex justify-between">
            <dt className="text-ink-2">Shipping</dt>
            <dd className="tabular-nums">{formatPrice(shippingCost)}</dd>
          </div>
        )}
        {tax > 0 && (
          <div className="flex justify-between">
            <dt className="text-ink-2">Tax</dt>
            <dd className="tabular-nums">{formatPrice(tax)}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <dt className="font-medium">Total</dt>
          <dd className="font-serif text-2xl tabular-nums">{formatPrice(total)}</dd>
        </div>
      </dl>
    </div>
  );
}
