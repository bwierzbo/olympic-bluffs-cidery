'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <section className="bg-ground py-16 sm:py-24">
      <div className="container-x">
        <div className="mx-auto max-w-2xl">
          <p className="eyebrow text-lav">Lavender shop</p>
          <h1 className="mt-1.5 font-serif text-[clamp(34px,5vw,56px)] leading-[1.05]">Thank you. Your order is in.</h1>
          <p className="mt-4 text-[16px] leading-relaxed text-ink-2">
            A confirmation is on its way to your email with everything you ordered.
          </p>

          {orderId && (
            <div className="mt-8 border border-line bg-paper p-5">
              <p className="eyebrow">Order number</p>
              <p className="mt-1 font-mono text-lg">{orderId}</p>
            </div>
          )}

          <div className="mt-8 border-t border-line pt-8">
            <h2 className="font-serif text-2xl">What happens next</h2>
            <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-ink-2">
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-lav" aria-hidden="true" />
                <span>You will get an email confirmation with your order details.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-lav" aria-hidden="true" />
                <span>If you chose pickup, we will let you know when it is ready at the farm.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-lav" aria-hidden="true" />
                <span>If you chose shipping, it goes out within 2 to 3 business days.</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {orderId && (
              <Link href={`/orders/${orderId}`} className="btn btn-primary">
                Track order
              </Link>
            )}
            <Link href="/lavender" className="btn btn-secondary">
              Back to the shop
            </Link>
            <Link href="/" className="btn btn-secondary">
              Home
            </Link>
          </div>

          <p className="mt-8 text-sm text-ink-3">
            Questions about your order?{' '}
            <Link href="/visit" className="text-ink underline underline-offset-4">
              Contact us
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ground" />}>
      <SuccessContent />
    </Suspense>
  );
}
