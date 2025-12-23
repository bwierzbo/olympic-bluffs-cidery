export default function ReturnsPage() {
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Returns & Refunds</h1>

        <div className="prose prose-sage max-w-none">
          <p className="text-lg text-gray-700 mb-6">
            At Olympic Bluffs Cidery & Lavender Farm, we take pride in the quality of our handcrafted
            lavender products. We handle returns and refunds on a case-by-case basis to ensure every
            customer has a positive experience.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Requesting a Return or Refund</h2>
          <p className="text-gray-700 mb-4">
            If you are not satisfied with your purchase, please contact us within 14 days of receiving
            your order. We will work with you to find a solution, which may include:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li>A full or partial refund</li>
            <li>An exchange for a different product</li>
            <li>Store credit for future purchases</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Conditions for Returns</h2>
          <p className="text-gray-700 mb-4">
            To be eligible for a return, items should be:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li>Unused and in the same condition you received them</li>
            <li>In the original packaging when possible</li>
            <li>Returned within 14 days of delivery</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Damaged or Defective Items</h2>
          <p className="text-gray-700 mb-4">
            If your order arrives damaged or defective, please contact us immediately with photos
            of the damage. We will arrange for a replacement or full refund at no additional cost to you.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Non-Returnable Items</h2>
          <p className="text-gray-700 mb-4">
            For health and safety reasons, certain items cannot be returned once opened:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li>Body care products (lotions, balms, oils)</li>
            <li>Culinary products (honey, spices, teas)</li>
            <li>Essential oils and aromatherapy items</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Refund Processing</h2>
          <p className="text-gray-700 mb-4">
            Once we receive and inspect your return, we will notify you of the approval status.
            Approved refunds will be processed to your original payment method within 5-7 business days.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Contact Us</h2>
          <p className="text-gray-700 mb-4">
            To request a return or refund, please email us at{' '}
            <a href="mailto:info@olympicbluffs.com" className="text-sage-600 hover:text-sage-700 underline">
              info@olympicbluffs.com
            </a>{' '}
            with your order number and reason for the return.
          </p>

          <p className="text-sm text-gray-500 mt-8">
            Last updated: December 2024
          </p>
        </div>
      </div>
    </section>
  );
}
