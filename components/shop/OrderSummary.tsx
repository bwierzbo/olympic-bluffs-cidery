'use client';

import { useCart } from './CartProvider';
import Image from 'next/image';

interface OrderSummaryProps {
  shippingCost?: number;
}

export default function OrderSummary({ shippingCost = 0 }: OrderSummaryProps) {
  const { items, totalAmount } = useCart();

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const tax = 0; // Calculate tax if needed
  const total = totalAmount + shippingCost + tax;

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

      {/* Items List */}
      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div key={item.product.id} className="flex gap-3">
            <div className="relative h-16 w-16 flex-shrink-0 bg-white rounded">
              <Image
                src={item.product.image || '/images/products/placeholder-lavender.svg'}
                alt={item.product.name}
                fill
                className="object-cover rounded"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {item.product.name}
              </h3>
              <p className="text-sm text-gray-600">
                Qty: {item.quantity} × {formatPrice(item.product.price)}
              </p>
            </div>
            <div className="text-sm font-medium text-gray-900">
              {formatPrice(item.product.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Breakdown */}
      <div className="border-t border-gray-200 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium text-gray-900">
            {formatPrice(totalAmount)}
          </span>
        </div>

        {shippingCost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium text-gray-900">
              {formatPrice(shippingCost)}
            </span>
          </div>
        )}

        {tax > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax</span>
            <span className="font-medium text-gray-900">{formatPrice(tax)}</span>
          </div>
        )}

        <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}
