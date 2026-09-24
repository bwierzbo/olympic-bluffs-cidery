import Link from 'next/link';

export default function CancelledPage() {
  return (
    <section className="bg-ground py-16 sm:py-24">
      <div className="container-x">
        <div className="mx-auto max-w-2xl">
          <p className="eyebrow text-lav">Lavender shop</p>
          <h1 className="mt-1.5 font-serif text-[clamp(34px,5vw,56px)] leading-[1.05]">The payment did not go through</h1>
          <p className="mt-4 text-[16px] leading-relaxed text-ink-2">
            Nothing was charged. Your cart is saved, so you can try again whenever you like.
          </p>

          <div className="mt-8 border-t border-line pt-8">
            <h2 className="font-serif text-2xl">The usual reasons</h2>
            <ul className="mt-4 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink-2">
              <li>A mistyped card number or expiration date</li>
              <li>Insufficient funds</li>
              <li>The card was declined by your bank</li>
              <li>The billing address does not match the card</li>
              <li>A network hiccup</li>
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop/checkout" className="btn btn-primary">
              Try again
            </Link>
            <Link href="/lavender" className="btn btn-secondary">
              Back to the shop
            </Link>
          </div>

          <p className="mt-8 text-sm text-ink-3">
            Need a hand? Write to{' '}
            <a href="mailto:info@olympicbluffs.com" className="text-ink underline underline-offset-4">
              info@olympicbluffs.com
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
